# -*- coding: utf-8 -*-
from PyPDF2 import PdfReader
import zipfile, re, os

os.chdir(r'F:\Users\eichh\Downloads\prototipo')
results = {}
for f in ['Casos_De_Uso_Textual.pdf', 'Diagrama casos de uso.drawio.pdf', 'Diagrama de clases.drawio.pdf', 'Guia_Metodologica_Proyecto.pdf']:
    try:
        r = PdfReader(os.path.join('contexto', f))
        text = []
        for p in r.pages:
            t = p.extract_text()
            if t: text.append(t)
        results[f] = '\n\n'.join(text)
        print('OK', f, len(results[f]))
    except Exception as e:
        print('ERR', f, e)

for f in ['preguntas-de-relevamiento-e-historia-de-usuario.docx', 'Análisis Estratégico y Gestión de Riesgos.docx']:
    try:
        z = zipfile.ZipFile(os.path.join('contexto', f))
        data = z.read('word/document.xml')
        text = re.sub(r'<[^>]+>', ' ', data.decode('utf-8', errors='ignore'))
        text = re.sub(r'\s+', ' ', text)
        results[f] = text
        print('OK', f, len(results[f]))
    except Exception as e:
        print('ERR', f, e)

for f in ['Backlog de Requisitos.odt', 'roles_de_equipo.odt']:
    try:
        z = zipfile.ZipFile(os.path.join('contexto', f))
        data = z.read('content.xml')
        text = re.sub(r'<[^>]+>', ' ', data.decode('utf-8', errors='ignore'))
        text = re.sub(r'\s+', ' ', text)
        results[f] = text
        print('OK', f, len(results[f]))
    except Exception as e:
        print('ERR', f, e)

with open('contexto_audit.txt', 'w', encoding='utf-8') as out:
    for k,v in results.items():
        out.write('\n\n' + '='*60 + '\n' + k + '\n' + '='*60 + '\n\n')
        out.write(v)
print('done')

