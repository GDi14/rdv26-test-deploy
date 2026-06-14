import os
import sys
import re
import json
from pathlib import Path

# Ensure dependencies are installed
def install_dependencies():
    missing = []
    try:
        import pandas
    except ImportError:
        missing.append("pandas")
    try:
        import openpyxl
    except ImportError:
        missing.append("openpyxl")
    try:
        import reportlab
    except ImportError:
        missing.append("reportlab")
    
    if missing:
        print(f"Missing dependencies: {', '.join(missing)}. Installing now...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
            print("Successfully installed missing dependencies.")
        except Exception as e:
            print(f"Error installing dependencies: {e}")
            print(f"Please run: pip install {' '.join(missing)}")
            sys.exit(1)

install_dependencies()

import pandas as pd
import requests
from dotenv import load_dotenv

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# Event ID friendly names mapping
EVENT_NAMES = {
    "Melodia": "MELODIA (Band)",
    "game f": "GAME F (Gaming)",
    "gourmet crusade": "GOURMET CRUSADE (Cooking)",
    "invogue": "INVOGUE (Fashion)",
    "seismic": "SEISMIC (Dance)",
    "non_participant": "NON-PARTICIPANT"
}

def clean_filename(name):
    return re.sub(r'[^a-zA-Z0-9_\- ]', '', name).strip().replace(' ', '_')

def main():
    # Load backend env config
    base_dir = Path(__file__).resolve().parents[1]
    backend_env = base_dir / 'backend' / '.env'
    load_dotenv(backend_env)
    
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
    
    print("Fetching registration records...")
    regs = []
    
    # Try fetching directly from Supabase
    if SUPABASE_URL and SUPABASE_KEY:
        url = f"{SUPABASE_URL}/rest/v1/registrations"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        try:
            res = requests.get(url, headers=headers)
            if res.status_code == 200:
                regs = res.json()
                print(f"Loaded {len(regs)} records directly from Supabase.")
        except Exception as e:
            print(f"Supabase request failed: {e}")
            
    # Fallback to local server API
    if not regs:
        local_url = "http://localhost:8000/api/registrations"
        try:
            res = requests.get(local_url)
            if res.status_code == 200:
                regs = res.json()
                print(f"Loaded {len(regs)} records from local server API.")
        except Exception as e:
            print(f"Local server request failed: {e}")
            
    if not regs:
        print("\nERROR: No registration data retrieved.")
        print("Please ensure the backend server is running on http://localhost:8000 or your backend/.env contains correct Supabase credentials.")
        sys.exit(1)
        
    # Group registrations by school
    school_groups = {}
    for r in regs:
        school = r.get("school", "").strip()
        if not school:
            continue
        if school not in school_groups:
            school_groups[school] = []
        school_groups[school].append(r)
        
    # Setup export folders
    export_dir = base_dir / 'exports'
    excel_dir = export_dir / 'excel'
    pdf_dir = export_dir / 'pdf'
    
    excel_dir.mkdir(parents=True, exist_ok=True)
    pdf_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\nProcessing exports for {len(school_groups)} schools...")
    
    for school_name, school_regs in school_groups.items():
        safe_name = clean_filename(school_name)
        
        # 1. Parse categories of registrations
        participants = []
        non_participants = []
        teachers = []
        food_veg = 0
        food_nonveg = 0
        confirmation_code = "N/A"
        
        for r in school_regs:
            name = r.get("full_name", "").strip()
            if not name:
                continue
            
            # Extract confirmation code
            if r.get("confirmation_code") and r.get("confirmation_code") != "N/A":
                confirmation_code = r.get("confirmation_code")
                
            # Classify
            if name == "FOOD_COUPONS":
                notes = r.get("notes") or ""
                vM = re.search(r"VEG:\s*(\d+)", notes, re.IGNORECASE)
                nvM = re.search(r"NON-VEG:\s*(\d+)", notes, re.IGNORECASE)
                if vM: food_veg = int(vM.group(1))
                if nvM: food_nonveg = int(nvM.group(1))
            elif r.get("grade") == "TEACHER":
                teachers.append({
                    "Name": name,
                    "Phone": r.get("phone", "N/A")
                })
            elif r.get("event_id") == "non_participant":
                non_participants.append({
                    "Name": name,
                    "Class & Div": r.get("grade", "N/A")
                })
            else:
                role = "Member"
                notes = r.get("notes") or ""
                role_match = re.search(r"Role:\s*(.+)", notes, re.IGNORECASE)
                if role_match:
                    role = role_match.group(1)
                    
                participants.append({
                    "Name": name,
                    "Class & Div": r.get("grade", "N/A"),
                    "Event": EVENT_NAMES.get(r.get("event_id"), r.get("event_id")),
                    "Role": role
                })
                
        # Total delegation cap logic (participants + non-participants)
        total_students = len(participants) + len(non_participants)
        
        # ==================== EXCEL GENERATION ====================
        excel_path = excel_dir / f"{safe_name}_registration.xlsx"
        
        # DataFrames
        df_overview = pd.DataFrame([
            ["School Name", school_name],
            ["Confirmation Code", confirmation_code],
            ["Total Delegation Students (Max 50)", total_students],
            ["Event Participants", len(participants)],
            ["Non-Participants (Spectators)", len(non_participants)],
            ["Accompanying Teachers", len(teachers)],
            ["Veg Food Coupons Requested", food_veg],
            ["Non-Veg Food Coupons Requested", food_nonveg],
            ["Total Food Coupons", food_veg + food_nonveg]
        ], columns=["Metric", "Value"])
        
        df_parts = pd.DataFrame(participants) if participants else pd.DataFrame(columns=["Name", "Class & Div", "Event", "Role"])
        df_nps = pd.DataFrame(non_participants) if non_participants else pd.DataFrame(columns=["Name", "Class & Div"])
        df_teachers = pd.DataFrame(teachers) if teachers else pd.DataFrame(columns=["Name", "Phone"])
        
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            df_overview.to_excel(writer, sheet_name="Overview", index=False)
            df_parts.to_excel(writer, sheet_name="Participants Roster", index=False)
            df_nps.to_excel(writer, sheet_name="Non-Participants", index=False)
            df_teachers.to_excel(writer, sheet_name="Teachers & Escorts", index=False)
            
        # ==================== PDF GENERATION ====================
        pdf_path = pdf_dir / f"{safe_name}_registration.pdf"
        
        # Setup reportlab document
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Styles
        primary_color = colors.HexColor('#fc2c08')
        secondary_color = colors.HexColor('#1C1C2E')
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=primary_color,
            spaceAfter=4,
            alignment=1 # Centered
        )
        
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=secondary_color,
            spaceAfter=20,
            alignment=1
        )
        
        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=secondary_color,
            spaceBefore=12,
            spaceAfter=6,
            borderPadding=2
        )
        
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor('#333333'),
            spaceAfter=4
        )
        
        # Header / Banner
        story.append(Paragraph("RDV26 FESTIVAL REGISTRATION RECEIPT", title_style))
        story.append(Paragraph(f"CONFIRMATION CODE: {confirmation_code}", subtitle_style))
        story.append(Spacer(1, 10))
        
        # School Details Table
        details_data = [
            [Paragraph("<b>SCHOOL</b>", body_style), Paragraph(school_name.upper(), body_style)],
            [Paragraph("<b>TOTAL DELEGATION</b>", body_style), Paragraph(f"{total_students} STUDENTS (CAP 50)", body_style)],
            [Paragraph("<b>EVENT PARTICIPANTS</b>", body_style), Paragraph(f"{len(participants)} STUDENTS", body_style)],
            [Paragraph("<b>NON-PARTICIPANTS</b>", body_style), Paragraph(f"{len(non_participants)} STUDENTS", body_style)],
            [Paragraph("<b>ACCOMPANYING TEACHERS</b>", body_style), Paragraph(f"{len(teachers)} TEACHERS", body_style)],
            [Paragraph("<b>FOOD COUPONS</b>", body_style), Paragraph(f"VEG: {food_veg}  |  NON-VEG: {food_nonveg}  |  TOTAL: {food_veg + food_nonveg}", body_style)]
        ]
        
        details_table = Table(details_data, colWidths=[2.2 * inch, 4.8 * inch])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fbfbfb')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e5e5')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(details_table)
        story.append(Spacer(1, 15))
        
        # Participants Roster Table
        story.append(Paragraph("I. EVENT PARTICIPANTS", section_title_style))
        if participants:
            parts_header = [["NAME", "CLASS & DIV", "EVENT", "ROLE"]]
            parts_rows = [[p["Name"], p["Class & Div"], p["Event"], p["Role"]] for p in participants]
            
            parts_table = Table(parts_header + parts_rows, colWidths=[2.2 * inch, 1.0 * inch, 2.3 * inch, 1.5 * inch])
            parts_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), secondary_color),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e5e5')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9f9f9')]),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 8),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,1), (-1,-1), 8),
            ]))
            story.append(parts_table)
        else:
            story.append(Paragraph("No event registrations recorded.", body_style))
        story.append(Spacer(1, 15))
        
        # Non-Participants Table
        story.append(Paragraph("II. NON-PARTICIPANTS", section_title_style))
        if non_participants:
            np_header = [["NAME", "CLASS & DIV"]]
            np_rows = [[n["Name"], n["Class & Div"]] for n in non_participants]
            
            np_table = Table(np_header + np_rows, colWidths=[4.5 * inch, 2.5 * inch])
            np_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), secondary_color),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e5e5')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9f9f9')]),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 8),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,1), (-1,-1), 8),
            ]))
            story.append(np_table)
        else:
            story.append(Paragraph("No non-participants registered.", body_style))
        story.append(Spacer(1, 15))
        
        # Teachers Table
        story.append(Paragraph("III. ACCOMPANYING TEACHERS & ESCORTS", section_title_style))
        if teachers:
            t_header = [["TEACHER NAME", "CONTACT PHONE"]]
            t_rows = [[t["Name"], t["Phone"]] for t in teachers]
            
            t_table = Table(t_header + t_rows, colWidths=[4.5 * inch, 2.5 * inch])
            t_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), secondary_color),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e5e5')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9f9f9')]),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 8),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,1), (-1,-1), 8),
            ]))
            story.append(t_table)
        else:
            story.append(Paragraph("No teachers registered.", body_style))
            
        doc.build(story)
        print(f"-> Generated: {excel_path.name} & {pdf_path.name}")
        
    print(f"\nSUCCESS! All exports saved under: {export_dir.resolve()}")

if __name__ == '__main__':
    main()
