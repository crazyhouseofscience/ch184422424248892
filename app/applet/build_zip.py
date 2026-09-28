import zipfile
import os

zip_path = 'public/Greenhouse_Effect_Lab_Windows.zip'
files = [
    ('public/Greenhouse_Effect_Lab.exe', 'Greenhouse_Effect_Lab.exe'),
    ('public/Greenhouse_Effect_Lab_Launcher.bat', 'Greenhouse_Effect_Lab_Launcher.bat'),
    ('public/Greenhouse_Effect_Lab_Launcher.vbs', 'Greenhouse_Effect_Lab_Launcher.vbs'),
    ('public/greenhouse_effect_lab_standalone.html', 'Greenhouse_Effect_Lab_Standalone.html'),
    ('public/greenhouse_effect_lab_packet.html', 'Greenhouse_Effect_Lab_Packet.html'),
    ('public/greenhouse_effect_lab_data.csv', 'Greenhouse_Effect_Lab_Data.csv'),
]

readme = """=======================================================
GREENHOUSE EFFECT & CLIMATE CHANGE LAB - DESKTOP EDITION
=======================================================

HOW TO OPEN & RUN:

Option 1 - Windows Executable (.exe):
   Double-click 'Greenhouse_Effect_Lab.exe'.
   It automatically launches the lab directly on your desktop.

Option 2 - 1-Click Batch Launcher (.bat):
   If your school district or antivirus prevents running unfamiliar .exe files,
   simply double-click 'Greenhouse_Effect_Lab_Launcher.bat'.
   It launches the lab in a clean, standalone desktop window without browser borders.

Option 3 - Silent Windows Script (.vbs):
   Double-click 'Greenhouse_Effect_Lab_Launcher.vbs' for a silent, instant launch.

Option 4 - Offline Webpage (.html):
   Right-click 'Greenhouse_Effect_Lab_Standalone.html' -> Open With -> Chrome or Edge.
   Runs 100% offline without internet.

Option 5 - Printable Student & Teacher Packet (.html):
   Double-click 'Greenhouse_Effect_Lab_Packet.html' to print student data sheets,
   inquiry CER questions, and the teacher answer key.
"""

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for src, arc in files:
        if os.path.exists(src):
            z.write(src, arc)
            print('Added to zip:', arc)
    z.writestr('README_How_To_Run.txt', readme)

print('Updated zip package:', zip_path, 'Size:', os.path.getsize(zip_path), 'bytes')
