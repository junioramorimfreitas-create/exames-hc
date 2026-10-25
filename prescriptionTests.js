/**
 * prescriptionTests.js
 * Testes unitários para validar os 3 casos reais do Soul MV (ICHC)
 */

const parser = require('./prescriptionParser.js');

const case1Text = `MV PEP Prontuário Eletrônico do Paciente
Página: 1 / 9
Emitido por:G.CHARMILLOT
Em: 21/09/2026 18:39
ICHC - INSTITUTO CENTRAL
Nome Social:
Paciente...: 7672062 - LUCIMAR MENDES DA SILVA
Atendimento: 11502956
Dt Nasc: 07/08/1969 (57a 1m 14d)
Prescrição.: 26239211 Data: 21/09/2026 16:00 Prescrição válida até: 22/09/2026 15:59
Convênio...: SUS INTERNACAO Plano: PLANO UNICO
Peso.......: 0,0 Altura: 0,0 Sup. Corporea: 0,0
Serviço: INFECTOLOGIA
Unid. Int..: [U11DS] UTI MI Leito..: 11DS12
CID: B461 MUCORMICOSE RINOCEREBRAL
Prestador.:CARLOS EDUARDO BARROS FERREIRA DE MORAES
Função: MEDICO(A) Nº Conselho: 283856
Rubrica do Responsável
PRESCRICAO MEDICA ICHC
Antimicrobiano
Alergia Alta Vigilância
Evento Adverso
Dose Padrão Alterada
Qtd Unidade SN Apl
Qtde Prescrita HEMOCOMPONENTES Dose Padrão Duração Frequência Datas/Horários
1 CONCENTRADO DE HEMACIAS 1 BOLSA 1 VEZ* IV URGENTE
[21/09] 00:30 |-> EXAMES PRE
TRANSFUSIONAIS I
1
 |-> EXAMES PRE
TRANSFUSIONAIS II
1
03 h 00 Min
CRM : 283856
CARLOS EDUARDO BARRO
MV | SoulMV | Versão SMA-PEP.2022.003.09.PATCH
MV PEP Prontuário Eletrônico do Paciente
Página: 2 / 9
Emitido por:G.CHARMILLOT
Em: 21/09/2026 18:39
ICHC - INSTITUTO CENTRAL
Nome Social:
Paciente...: 7672062 - LUCIMAR MENDES DA SILVA
Atendimento: 11502956
Dt Nasc: 07/08/1969 (57a 1m 14d)
Prescrição.: 26242540 Data: 21/09/2026 16:00 Prescrição válida até: 22/09/2026 15:59
Convênio...: SUS INTERNACAO Plano: PLANO UNICO
Peso.......: 0,0 Altura: 0,0 Sup. Corporea: 0,0
Serviço: INFECTOLOGIA
Unid. Int..: [U11DS] UTI MI Leito..: 11DS12
CID: B461 MUCORMICOSE RINOCEREBRAL
Prestador.:YOON JI SHIN
Função: MEDICO(A) Nº Conselho: 249503
Rubrica do Responsável
PRESCRICAO MEDICA ICHC
Antimicrobiano
Alergia Alta Vigilância
Evento Adverso
Dose Padrão Alterada
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
2 glicose 50% - ampola 10ml 40 MILILITRO VER IV
OBSERVA
ÇÃO
Obs.: Se dextro <70mg/dl e sem condições de reposição oral
3 metoclopramida 5mg/ml - ampola
2ml
10 MILIGRAMA 8/8H - 8/8H S IV
Obs.: Se náuseas ou vômitos
4 dipirONA 500mg/ml - ampola 2ml 2000 MILIGRAMA 6/6H - 6/6H IV [21/09] . 16 . 22
[22/09] . 04 . 10
5 pantoprazol 40 mg po liofilizado
frasco-ampola
40 MILIGRAMA JEJUM - IV
JEJUM
[22/09] . 06
Obs.: Reconstituir opó lifilizado em 10 mL de cloreto de sódio 0,9%.
 |-> agulha hipodermica desc
40/25X12 PONTA ROMBA
1
 |-> oclusor para bico de seringa 1
 |-> seringa descartavel 20 ML 1
 |-> seringa descartavel com
SOLUCAO SALINA
2
 |-> luva de procedimento nao esteril 2
 |-> sache alcoolico 70% 3X3cm
SWAB
2
6 insulina lispro 100UI/ml uso BIC
(diluição)
100 UNIDADE
INTERNACIO
NAL
ACM IV
 |-> cloreto de SODIO 0,9% -
bolsa 100 ml
100 MILILITRO
7 insulina lispro 100UI/ml - frasco
ampola 10ml
1 UNIDADE
INTERNACIO
NAL
VER SC
OBSERVA
ÇÃO
Conforme DX:
<70 mg/dl: protocolo de hipoglicemia
141-180 mg/dl: 2 UI
181-220 mg/dl: 4 UI
221-260 mg/dl: 6 UI
261-300 mg/dl: 8 UI
301-350 mg/dl: 10 UI
351 - 400 mg/dl: 12 UI
> 400 mg/dL: 14 UI
Obs.:
Qtd Unidade SN Apl
Qtde Prescrita DIETA Dose Padrão Duração Frequência Datas/Horários
8 DIETA ENTERAL SISTEMA
FECHADO ; 10.00 MILILITRO/Hr
400 MILILITRO CONTINU SNG
O
[21/09] . 16
9 AGUA ENTERAL ; ML/Hr 20 ML 4/4H SNG
DIETA -
4/4h DIETA
[21/09] . 17 . 21
[22/09] . 01 . 05 . 09 . 13
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
MV | SoulMV | Versão SMA-PEP.2022.003.09.PATCH
MV PEP Prontuário Eletrônico do Paciente
Página: 3 / 9
Emitido por:G.CHARMILLOT
Em: 21/09/2026 18:39
ICHC - INSTITUTO CENTRAL
Nome Social:
Paciente...: 7672062 - LUCIMAR MENDES DA SILVA
Atendimento: 11502956
Dt Nasc: 07/08/1969 (57a 1m 14d)
Prescrição.: 26242540 Data: 21/09/2026 16:00 Prescrição válida até: 22/09/2026 15:59
Convênio...: SUS INTERNACAO Plano: PLANO UNICO
Peso.......: 0,0 Altura: 0,0 Sup. Corporea: 0,0
Serviço: INFECTOLOGIA
Unid. Int..: [U11DS] UTI MI Leito..: 11DS12
CID: B461 MUCORMICOSE RINOCEREBRAL
Prestador.:YOON JI SHIN
Função: MEDICO(A) Nº Conselho: 249503
Rubrica do Responsável
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
10 heparina 5000ui - ampola 0,25ml 5000 UNIDADE
INTERNACIO
NAL
12/12H - SC
12/12H
[21/09] . 22
[22/09] . 10
11 rocuronio 10mg/ml - frasco ampola
5ml (SEM DILUICAO)
100 MILIGRAMA AGORA IV URGENTE
[21/09] . 14
Obs.: Para procedimento - troca de TOT
12 norepinefrina 1mg/ml - ampola 4ml
Dispositivo: BOMBA DE INFUSÃO
16 MILIGRAMA ACM IV
Cada ampola de 4 mL contém 8 mg de hemitartarato de norepinefrina (2 mg/mL),
equivalentes a 4 mg de norepinefrina base (1 mg/mL).
Obs.:
 |-> glicose 5% - bolsa 250 ml 250 MILILITRO
13 fentanila 0,05mg/ml - ampola 10ml
(COM DILUIÇÃO)
Dispositivo: BOMBA DE INFUSÃO
20 MILILITRO ACM IV
 |-> cloreto de SODIO 0,9% -
bolsa 100 ml
80 MILILITRO
14 midazolam 5mg/ml - ampola 10 ml
(COM DILUICAO)
Dispositivo: BOMBA DE INFUSÃO
150 MILIGRAMA ACM IV [21/09] . 18
 |-> glicose 5% - bolsa 100 ml 120 MILILITRO
15 bromoPRIDa 4mg/ml - frasco 20ml 50 GOTA 12/12H - SNE
12/12H
[21/09] . 22
[22/09] . 10
16 bisacodil 5mg - comprimido 10 MILIGRAMA 12/12H - SNE
12/12H
[21/09] . 22
[22/09] . 10
17 lactulose 667 mg/ml solucao oral
frasco 120 ml
10 MILILITRO 8/8H - 8/8H SNE [21/09] . 22
[22/09] . 06 . 14
Qtd Unidade SN Apl
Qtde Prescrita ANTIMICROBIANOS Dose Padrão Duração Frequência Datas/Horários
18 (D11/14) anfotericina B 50mg
LIPOSSOMAL - frasco ampola
250 MILIGRAMA 1X TARDE IV
- 1X
TARDE
[22/09] . 15
Justificativa: CCIH: U211824
MUCORMICOSE RINOCEREBRAL
Obs.:
 |-> glicose 5% - bolsa 500 ml 1 BOLSA 500 ML
19 (D10/14) linezolida 2 mg/ml -
bolsa 300ml
600 MILIGRAMA 12/12H - IV
12/12H
[21/09] . 22
[22/09] . 10
Qtd Unidade SN Apl
Qtde Prescrita SOROTERAPIA Dose Padrão Duração Frequência Datas/Horários
20 glicose 50% - bolsa 500 ml 250 MILILITRO ACM IV
Qtd Unidade SN Apl
Qtde Prescrita ANTIMICROBIANOS Dose Padrão Duração Frequência Datas/Horários
21 (D1/15)
sulfametoxazol+trimetoprima(80
mg+16 mg)/ml - ampola 5ml
2 AMPOLA 480
MG
8/8H - 8/8H IV [21/09] . 22
[22/09] . 06 . 14
22 (D2/14) MEROpenem 1000mg -
frasco ampola - infusão estendida ;
MILIGRAMA/Hr
Dispositivo: BOMBA DE INFUSÃO
1000 MILIGRAMA 8/8H - 8/8H IV [21/09] . 22
[22/09] . 06 . 14
23 Protocolo - Isavuconazol 200mg po
liof frasco-ampola
200 MILIGRAMA 8/8H - 8/8H IV [21/09] . 22
[22/09] . 06 . 14
Qtd Unidade SN Apl
Qtde Prescrita PROCEDIMENTOS MEDICOS Dose Padrão Duração Frequência Datas/Horários
24 GLICEMIA CAPILAR 1 6/6H - 6/6H [21/09] . 20
[22/09] . 02 . 08 . 14
Qtd Unidade SN Apl
Qtde Prescrita PROCEDIMENTOS ASSISTENCIAIS Dose Padrão Duração Frequência Datas/Horários
25 QUANTIFICAR DIURESE [21/09] . 16
26 CUIDADOS ESPECIAIS DE
ENFERMAGEM
[21/09] . 16
CRM : 249503
YOON JI SHIN
MV | SoulMV | Versão SMA-PEP.2022.003.09.PATCH
MV PEP Prontuário Eletrônico do Paciente
Página: 5 / 9
PRESCRICAO MED DIALISE - ICHC
14 CVVHD - HEMODIÁLISE
CONTÍNUA
[21/09] . 16
Na 145+ BIC 30+ K 4 P 3,1
27 RX TORAX ; Exame: 2744123 URGENTE
28 cloreto de SODIO 20% - ampola
10ml (EM BOLUS)
20 MILILITRO AGORA IV URGENTE
[21/09] . 20
29 TC CRANIO ; Exame: 2744406 URGENTE
30 TC ANGIO ARTERIAL INTRACRANIANA
MV | SoulMV | Versão SMA-PEP.2022.003.09.PATCH`;

const case2Text = `MV PEP Prontuário Eletrônico do Paciente
Página: 1 / 6
Emitido por:G.CHARMILLOT
Em: 21/09/2026 19:02
ICHC - INSTITUTO CENTRAL
Nome Social:
Paciente...: 3712242 - MATHEUS DE OLIVEIRA SLAGINSKI
Atendimento: 11472766
Dt Nasc: 17/02/2005 (21a 7m 3d)
Prescrição.: 26242362 Data: 21/09/2026 16:00 Prescrição válida até: 22/09/2026 15:59
Convênio...: SUS INTERNACAO Plano: PLANO UNICO
Peso.......: 0,0 Altura: 0,0 Sup. Corporea: 0,0
Serviço: CLINICA GERAL
Unid. Int..: [U11DS] UTI MI Leito..: 11DS11
CID: D570 ANEMIA FALCIFORME COM CRISE
Prestador.:YOON JI SHIN
Função: MEDICO(A) Nº Conselho: 249503
Rubrica do Responsável
PRESCRICAO MEDICA ICHC
Antimicrobiano
Alergia Alta Vigilância
Evento Adverso
Dose Padrão Alterada
Alergias: CEFTRIAXONA
Qtd Unidade SN Apl
Qtde Prescrita DIETA Dose Padrão Duração Frequência
DIETA PASTOSA Suspenso dia.: 21/09
+ líquidos finos Prescrição......: 26242362
Restrição hídrica - 1200 mL/d
Obs.:
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
2 dipirONA 500mg/ml - ampola 2ml 2000 MILIGRAMA 6/6H - 6/6H IV [21/09] . 16 . 22
[22/09] . 04 . 10
3 insulina lispro 100UI/ml - frasco
ampola 10ml
1 UNIDADE
INTERNACIO
NAL
VER SC
OBSERVA
ÇÃO
Corrigir se hiperglicemia se:
180 A 200 - 2 UI
200 A 250 4 UI
250 A 300 - 6 UI
300 A 350 - 8 UI
Obs.:
4 pantoprazol 40 mg po liofilizado
frasco-ampola
40 MILIGRAMA 1X MANHÃ IV
- 1X
MANHÃ
[22/09] . 06
5 glicose 50% - ampola 10ml 40 MILILITRO ACM IV
6 metoclopramida 5mg/ml - ampola
2ml
10 MILIGRAMA 8/8H - 8/8H S IV
Obs.: Se náuseas ou vômitos
7 FUROSemida 10mg/ml - ampola 2ml 60 MILIGRAMA 1X TARDE IV
- 1X
TARDE
[21/09] . 17
8 bisacodil 5mg - comprimido 10 MILIGRAMA 12/12H - ORAL
12/12H
[21/09] . 22
[22/09] . 10
9 simeticona 75 mg/ml solucao oral
frasco 10 ml
100 GOTA 6/6H - 6/6H ORAL [21/09] . 16 . 22
[22/09] . 04 . 10
10 anlodipino 5mg - comprimido 10 MILIGRAMA 1X MANHÃ ORAL
- 1X
MANHÃ
[22/09] . 10
11 hidrALAzina (cloridrato) 25 mg
comprimido revestido
100 MILIGRAMA 8/8H - 8/8H ORAL [21/09] . 23
[22/09] . 06 . 15
12 isossorbida (mononitrato) 40 mg
comprimido
20 MILIGRAMA 8/8H - 8/8H ORAL [21/09] . 22
[22/09] . 06 . 14
13 baclofeno 10mg - comprimido 5 MILIGRAMA 1X NOITE - ORAL
1X NOITE
[21/09] . 22
14 acido acetilsalicilico 100mg -
comprimido
100 MILIGRAMA 1X POS- ORAL
ALMOCO -
1X POSALMOCO
[22/09] . 13
15 (D8/7) linezolida 2 mg/ml - bolsa
300ml
600 MILIGRAMA 12/12H - IV
12/12H
[21/09] . 22
[22/09] . 10
16 risperidona 2 mg comprimido 2 MILIGRAMA 12/12H - ORAL
12/12H
[21/09] . 22
[22/09] . 10
17 morfina 10mg/ml - amp 1ml (Em
Bolus)
2 MILIGRAMA ACM IV
18 salbutamol (sulfato) 100 mcg/dose
aerosol oral fr 200 doses
4 DOSE 6/6H - 6/6H IN O [21/09] . 16 . 22
[22/09] . 04 . 10
19 salbutamol (sulfato) 100 mcg/dose
aerosol oral fr 200 doses
4 DOSE ACM IN O
20 GLICEMIA CAPILAR 1 6/6H - 6/6H
21 RX TORAX ; Exame: 2743889 URGENTE
22 CUIDADOS ESPECIAIS DE ENFERMAGEM
23 aTENOLol 25mg - capsula 50 MILIGRAMA 2XDIA - ORAL
2XDIA
[21/09] . 16
[22/09] . 08
24 heparina 5000ui - ampola 0,25ml 5000 UNIDADE
INTERNACIO
NAL
12/12H - SC
12/12H
25 DIETA GERAL [21/09] 17:32
+ líquidos finos
Restrição hídrica 1200 mL/d
Obs.:
DIETA PASTOSA Suspenso dia.: 21/09
+ líquidos finos Prescrição......: 26242362
Restrição hídrica - 1200 mL/d
Obs.:
26 RX TORAX ; Exame: 2744394 URGENTE`;

const case3Text = `MV PEP Prontuário Eletrônico do Paciente
Página: 1 / 5
Emitido por:G.CHARMILLOT
Em: 21/09/2026 19:05
ICHC - INSTITUTO CENTRAL
Nome Social:
Paciente...: 7672774 - JUSSARA PEREIRA MARQUES
Atendimento: 11516509
Dt Nasc: 16/12/1997 (28a 9m 5d)
Prescrição.: 26241772 Data: 21/09/2026 16:00 Prescrição válida até: 22/09/2026 15:59
Convênio...: SUS INTERNACAO Plano: PLANO UNICO
Peso.......: 0,0 Altura: 0,0 Sup. Corporea: 0,0
Serviço: INFECTOLOGIA
Unid. Int..: [U11DS] UTI MI Leito..: 11DS03
CID: B24 DOENCA PELO VIRUS DA IMUNODEFICIENCIA HUMANA [HIV] NAO ESPECIFICADA
Prestador.:LEONARDO MAGALHAES ANDRADE E SILVA
Função: MEDICO(A) Nº Conselho: 269547
Rubrica do Responsável
PRESCRICAO MEDICA ICHC
Antimicrobiano
Alergia Alta Vigilância
Evento Adverso
Dose Padrão Alterada
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
1 metoclopramida 5mg/ml - ampola
2ml
10 MILIGRAMA 8/8H - 8/8H S IV
Obs.: Se náuseas ou vômitos
2 insulina lispro 100UI/ml - frasco
ampola 10ml
1 UNIDADE
INTERNACIO
NAL
ACM SC
3 pantoprazol 40 mg po liofilizado
frasco-ampola
40 MILIGRAMA JEJUM - IV
JEJUM
[22/09] . 06
Qtd Unidade SN Apl
Qtde Prescrita DIETA Dose Padrão Duração Frequência Datas/Horários
4 DIETA ENTERAL SISTEMA
FECHADO ; 30.00 MILILITRO/Hr
1200 MILILITRO CONTINU SNE
O
[21/09] . 16
Qtd Unidade SN Apl
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
5 dipirONA 500mg/ml - ampola 2ml 2000 MILIGRAMA 6/6H - 6/6H IV [21/09] . 16 . 22
[22/09] . 04 . 10
6 DEXametasona 4 mg/ml - frasco
ampola 2,5 ml
4 MILIGRAMA 12/12H - IV
12/12H
[21/09] . 22
[22/09] . 10
7 heparina 5000ui - ampola 0,25ml 5000 UNIDADE
INTERNACIO
NAL
12/12H - SC
12/12H
[21/09] . 22
[22/09] . 10
difenidramina 50 mg/ml - ampola 1
mL
50 MILIGRAMA 1X NOITE - IV
1X NOITE
Suspenso dia.: 21/09
Prescrição......: 26241772
9 AGUA ENTERAL ; ML/Hr 50 ML 6/6H - 6/6H SNE [21/09] . 16 . 22
[22/09] . 04 . 10
10 filgrastim 300 mcg - frasco ampola 300 MICROGRAM
A
1X MANHÃ SC
- 1X
MANHÃ
[22/09] . 10
11 cloreto de calcio 100mg/ml - ampola
5ml
1500 MILILITRO AGORA IV URGENTE
[21/09] . 14
12 bisacodil 5mg - comprimido 5 MILIGRAMA 12/12H - SNE
12/12H
[21/09] . 22
[22/09] . 10
bicarbonato de sodio 500mg -
comprimido
500 MILIGRAMA 8/8H - 8/8H SNE Suspenso dia.: 21/09
Prescrição......: 26241772
14 (D7/21)
sulfametoxazol+trimetoprima(80
mg+16 mg)/ml - ampola 5ml
3 AMPOLA 480
MG
6/6H - 6/6H IV [21/09] . 16 . 22
[22/09] . 04 . 10
15 (D6/14) ganciclovir 1mg/ml - bolsa
100ml
300 MILIGRAMA 12/12H - IV
12/12H
[21/09] . 22
[22/09] . 10
16 cloreto de SODIO 0,9% - bolsa 1000
ml
1000 MILILITRO CONTINU SNE
O
[21/09] . 22
17 cloreto de SODIO 0,9% - bolsa
500ml
500 MILILITRO AGORA IV URGENTE
[21/09] . 14
 |-> cloreto de POTASSIO 19,1% -
amp 10ml (COM DILUIÇÃO)
20 MILILITRO
 |-> sulfato de magnesio 10% -
ampola 10ml (COM DILUIÇÃO)
20 MILILITRO
18 bicarbonato de sodio 10% solucao
oral - frasco 250ml
50 MILILITRO 8/8H - 8/8H SNE [21/09] . 22
[22/09] . 06 . 14
20 vaselina semissolida 50% + lanolina 50% pomada bis 10 g 1 BISNAGA 6/6H BUC
21 propantelina (brometo) 10 mg/g gel
bisnaga 60 g
1 BISNAGA 8/8H - 8/8H DERM [21/09] . 22
[22/09] . 06 . 14
difenidramina 50 mg/ml Suspenso dia.: 21/09
bicarbonato de sodio 500mg Suspenso dia.: 21/09
22 DIETA PAPA II [21/09] 17:50
Obs.: E liquidos néctar`;

function runTests() {
  console.log("=== EXECUTANDO TESTES DO PRESCRIPTION PARSER ===\n");

  // TESTE 1
  console.log("--- TESTE CASO 1: Paciente UTI com Mucormicose ROC ---");
  const res1 = parser.organizePrescription(case1Text);
  console.log(res1.plainText);

  // Asserções Caso 1
  if (!res1.plainText.includes("Neurológico: Fentanil + Midazolam")) {
    throw new Error("Caso 1 Falhou: Fentanil e Midazolam devem ser contínuos no início do Neurológico");
  }
  if (!res1.plainText.includes("Cardiovascular: Noradrenalina")) {
    throw new Error("Caso 1 Falhou: Noradrenalina deve ser o primeiro no Cardiovascular");
  }
  if (!res1.plainText.includes("Respiratório: -")) {
    throw new Error("Caso 1 Falhou: Respiratório deve conter traço -");
  }
  if (!res1.plainText.includes("HNF 5000UI 12/12h SC")) {
    throw new Error("Caso 1 Falhou: HNF 5000UI 12/12h SC ausente em Hematológico");
  }
  if (!res1.plainText.includes("Infeccioso: Anfotericina B lipossomal 250mg 1x tarde IV (D11/14)")) {
    throw new Error("Caso 1 Falhou: Anfotericina B lipossomal ausente ou sem dia");
  }
  if (!res1.plainText.includes("Metoclopramida 10mg 8/8h IV SN")) {
    throw new Error("Caso 1 Falhou: Metoclopramida SN ausente");
  }
  if (!res1.plainText.includes("Abdominal: Dieta enteral + AE 20ml 4/4h SNG")) {
    throw new Error("Caso 1 Falhou: Abdominal deve iniciar com Dieta enteral seguida imediatamente por AE");
  }
  console.log("✓ Caso 1 passou com sucesso!\n");

  // TESTE 2
  console.log("--- TESTE CASO 2: Paciente com Anemia Falciforme ---");
  const res2 = parser.organizePrescription(case2Text);
  console.log(res2.plainText);

  // Asserções Caso 2
  if (res2.plainText.includes("DIETA PASTOSA")) {
    throw new Error("Caso 2 Falhou: DIETA PASTOSA suspensa não foi descartada");
  }
  if (!res2.plainText.includes("Abdominal: Dieta geral (restrição hídrica 1200ml/d)")) {
    throw new Error("Caso 2 Falhou: Abdominal deve iniciar com Dieta geral");
  }
  if (!res2.plainText.includes("Salbutamol 4 jatos 6/6h INAL + Salbutamol 4 jatos ACM INAL")) {
    throw new Error("Caso 2 Falhou: Salbutamol regular e ACM ausente no Respiratório");
  }
  if (!res2.plainText.includes("Linezolida 600mg 12/12h IV (D8/7)")) {
    throw new Error("Caso 2 Falhou: Linezolida (D8/7) ausente");
  }
  if (!res2.plainText.includes("AAS 100mg 1x/dia VO")) {
    throw new Error("Caso 2 Falhou: AAS 100mg ausente em Hematológico");
  }
  console.log("✓ Caso 2 passou com sucesso!\n");

  // TESTE 3
  console.log("--- TESTE CASO 3: Paciente HIV / CMV / Pneumocistose ---");
  const res3 = parser.organizePrescription(case3Text);
  console.log(res3.plainText);

  // Asserções Caso 3
  if (res3.plainText.includes("Difenidramina") || res3.plainText.includes("difenidramina")) {
    throw new Error("Caso 3 Falhou: Difenidramina suspensa não foi descartada");
  }
  if (!res3.plainText.includes("Cardiovascular: -")) {
    throw new Error("Caso 3 Falhou: Cardiovascular deveria estar vazio (-)");
  }
  if (!res3.plainText.includes("Filgrastim 300mcg 1x manhã SC")) {
    throw new Error("Caso 3 Falhou: Filgrastim ausente em Hematológico");
  }
  if (!res3.plainText.includes("Dexametasona 4mg 12/12h IV")) {
    throw new Error("Caso 3 Falhou: Dexametasona ausente em Respiratório");
  }
  if (!res3.plainText.includes("Propantelina gel 1 bisnaga 8/8h Tópico")) {
    throw new Error("Caso 3 Falhou: Propantelina gel ausente em Respiratório");
  }
  if (!res3.plainText.includes("[SF 0,9% 500ml + KCl 19,1% 20ml + MgSO4 10% 20ml] IV agora")) {
    throw new Error("Caso 3 Falhou: Soro composto com aditivos não foi formatado corretamente");
  }
  if (!res3.plainText.includes("Abdominal: Dieta Papa II + AE 50ml 6/6h SNE")) {
    throw new Error("Caso 3 Falhou: Abdominal deve iniciar com Dieta Papa II seguida imediatamente por AE");
  }
  if (!res3.plainText.includes("Ganciclovir 300mg 12/12h IV (D6/14)")) {
    throw new Error("Caso 3 Falhou: Ganciclovir (D6/14) ausente em Infeccioso");
  }
  if (!res3.boldText.includes("**Cardiovascular:** -") || !res3.boldText.includes("**Infeccioso:** Sulfametoxazol/Trimetoprima")) {
    throw new Error("Caso 3 Falhou: Formatação em negrito (boldText) incorreta");
  }
  if (!res3.htmlText.includes("<b>Cardiovascular:</b> -")) {
    throw new Error("Caso 3 Falhou: Formatação HTML (htmlText) incorreta");
  }
  if (!res3.plainText.includes("Outros: Vaselina/Lanolina pomada 1 bisnaga 6/6h Bucal")) {
    throw new Error("Caso 3 Falhou: Sistema Outros deveria aparecer com Vaselina/Lanolina pomada");
  }
  console.log("✓ Caso 3 passou com sucesso!\n");

  // TESTE 4: Novas regras das 10 prescrições (Conversão mL->mg, Eletrólito+Diluente, Deduplicação 'agora', Imunossupressor/Vitaminas, Outros condicional)
  console.log("--- TESTE CASO 4: Novas regras clínicas das 10 prescrições ---");
  const case4Sample = `MV PEP Prontuário Eletrônico do Paciente
Qtde Prescrita MEDICAMENTOS Dose Padrão Duração Frequência Datas/Horários
1 fosfato de potassio 2meq/ml -
ampola 10ml
10 MILILITRO AGORA IV URGENTE
[24/10] 00:25
 |-> glicose 5% - bolsa 250 ml 250 MILILITRO
2 levetiracetam 100 mg/ml solucao
oral frasco 150 ml
10 MILILITRO 12/12H - GTRS
12/12H
3 quetiapina 25 mg/5ml suspensao
oral c/ 100ml
10 MILILITRO 1X NOITE - SNE
1X NOITE
4 sulfametoxazol+trimetoprin (200
mg+40 mg)/5ml - susp. oral frasco
10 MILILITRO 3X/SEMAN SNE
A - SEGQUA-SEX
5 tacrolimo 1mg - capsula 1 MILIGRAMA 12/12H - ORAL
12/12H
6 tiamina (vitamina B1) 300mg -
comprimido
1 COMPRIMID
O
1XDIA - ORAL
1XDIA
7 dipirONA 500mg/ml - ampola 2ml 2000 MILIGRAMA AGORA IV URGENTE
8 dipirONA 500mg/ml - ampola 2ml 2000 MILIGRAMA 6/6H - 6/6H S IV
Obs.: se dor
tenofovir 300 mg + lamivudina 300
mg comprimido revestido
1 COMPRIMID
O
1X MANHÃ SNE
Suspenso dia.: 24/10
Prescrição......: 26539825`;

  const res4 = parser.organizePrescription(case4Sample);
  console.log(res4.plainText);

  if (!res4.plainText.includes("Levetiracetam 1g 12/12h GTRS")) {
    throw new Error("Caso 4 Falhou: Levetiracetam 100mg/ml (10ml) deveria converter para 1g com via GTRS");
  }
  if (!res4.plainText.includes("Quetiapina 50mg 1x noite SNE")) {
    throw new Error("Caso 4 Falhou: Quetiapina 25mg/5ml (10ml) deveria converter para 50mg");
  }
  if (!res4.plainText.includes("Sulfametoxazol/Trimetoprima 400/80mg 3x/sem SNE")) {
    throw new Error("Caso 4 Falhou: SMT/TMP suspensão (10ml) deveria converter para 400/80mg 3x/sem");
  }
  if (!res4.plainText.includes("[Fosfato de potássio 10ml + SG 5% 250ml] IV agora")) {
    throw new Error("Caso 4 Falhou: Eletrólito com diluente em |-> deveria formatar entre colchetes");
  }
  if (!res4.plainText.includes("Hematológico: Tacrolimo 1mg 12/12h VO")) {
    throw new Error("Caso 4 Falhou: Tacrolimo deveria estar em Hematológico");
  }
  if (!res4.plainText.includes("Tiamina 300mg 1x/dia VO")) {
    throw new Error("Caso 4 Falhou: Tiamina 300mg (1 cp) deveria converter para 300mg em Renal/Metabólico");
  }
  if (res4.plainText.includes("Dipirona 2g IV agora")) {
    throw new Error("Caso 4 Falhou: Dose 'agora' de Dipirona deveria ser omitida pois já existe Dipirona prescrita no sistema");
  }
  if (res4.plainText.includes("Outros:")) {
    throw new Error("Caso 4 Falhou: Sistema 'Outros' não deveria ser exibido quando vazio");
  }
  console.log("✓ Caso 4 passou com sucesso!\n");

  console.log("==================================================");
  console.log("TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!");
  console.log("==================================================");
}

runTests();
