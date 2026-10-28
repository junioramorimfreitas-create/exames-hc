const assert = require("assert");
const {
  parsePdfBlocks,
  parseWebBlocks,
  mergeAndConsolidateCultures,
  generateCulturesText
} = require("./cultureParser.js");

// ==========================================================================
// Suíte de Testes do Parser de Culturas & Antibiograma (HCFMUSP)
// Baseada nos laudos reais enviados pelo usuário (Página Web + PDF BrCAST)
// ==========================================================================

// 1. Exemplo 1 (KALIANE): Sec. Traqueal c/ Stenotrophomonas + CIM Levofloxacina + HMC canceladas + Amostra inadequada
const sampleWeb1 = `
20/10/2026 20:05:33
Pedido : 20260100488242
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 20/10/2026 20:05
EXAME BACTERIOSCÓPICO - SECREÇÃO TRAQUEAL - ,SECREÇÃO TRAQUEAL
EXAME BACTERIOSCÓPICO	 	Não foram observados microrganismos	Presença de microorganismos da flora local
Coloração de GRAM
EXAME BACTERIOSCÓPICO	 	Raras Células Epiteliais
EXAME BACTERIOSCÓPICO	 	Alguns Leucócitos Polimorfonucleares

20/10/2026 20:05:33
Pedido: 20260100488242
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA AERÓBIA - SECREÇÃO TRAQUEAL - - SECREÇÃO TRAQUEAL
Coletado em: 20/10/2026 20:05
1 - Stenotrophomonas maltophilia
ATENÇÃO: O perfil de sensibilidade está disponibilizado em laudo complementar no formato PDF.

20/10/2026 20:05:33
Pedido : 20260100488242
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 20/10/2026 20:05
CONCENTRAÇÃO INIBITÓRIA MÍNIMA - SECREÇÃO TRAQUEAL - ,SECREÇÃO TRAQUEAL
Microrganismo testado:	 	Stenotrophomonas maltophilia	CLSI / EUCAST
Data de Isolamento:	 	25/10/2026		
Antibiótico testado:	 	Levofloxacina
M.I.C:	 	0,25 mg/L
* Levofloxacina: CIM <=0,5 considerar como opção terapêutica

14/10/2026 10:25:09
Pedido : 20260100477354
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 14/10/2026 10:25
CULTURA AERÓBIA - SANGUE PERIFÉRICO - MSD,SANGUE PERIFÉRICOMSD
CULTURA AERÓBIA	 	Negativa	Negativa

14/10/2026 10:25:09
Pedido : 20260100477354
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 14/10/2026 10:25
CULTURA AERÓBIA - SANGUE PERIFÉRICO - SE,SANGUE PERIFÉRICOSE
EXAME CANCELADO. 

14/10/2026 10:25:09
Pedido : 20260100477354
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 14/10/2026 10:25
CULTURA PARA ANAERÓBIOS - SANGUE PERIFÉRICO - MSD,SANGUE PERIFÉRICOMSD
CULTURA PARA ANAERÓBIOS	 	Negativa	Negativa

09/10/2026 19:16:06
Pedido : 20260100471477
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 09/10/2026 19:16
CULTURA AERÓBIA - SECREÇÃO TRAQUEAL - ,SECREÇÃO TRAQUEAL
CULTURA AERÓBIA	 	AMOSTRA COM CÉLULAS EPITELIAIS >= 10 /CAMPO.	Presença de microrganismo da flora local
`;

// 2. Exemplo 3 (RENATO): Hemoculturas positivas (frasco irmão idêntico + preliminar c/ Gram) + Escarro Flora normal + Candida albicans
const sampleWeb3 = `
22/10/2026 16:14:36
Pedido : 20260100492240
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 22/10/2026 13:00
BACTERIOSCÓPICO DE HEMOCULTURA AEROBIA - SANGUE PERIFÉRICO - ART FEM DIR,SANGUE PERIFÉRICOART FEM DIR
BACTERIOSCÓPICO DE HEMOCULTURA AEROBIA	 	Cocos Gram Positivos Agrupados	Ausência de Microrganismos

22/10/2026 16:14:36
Pedido : 20260100492240
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 22/10/2026 13:00
CULTURA AERÓBIA - SANGUE PERIFÉRICO - ART FEM DIR,SANGUE PERIFÉRICOART FEM DIR
CULTURA AERÓBIA	 	Positiva	Negativa
T. Detecção:	 	00 Dias - 18 Horas 16 Minutos 20 Segundos		
Identificação e perfil de sensibilidade idênticos aos da cultura obtida a partir do mesmo material biológico, com a mesma via de coleta e data correspondente. Para mais informações, consultar o resultado disponível na requisição: 0100492240.

22/10/2026 16:14:36
Pedido: 20260100492240
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA AERÓBIA - SANGUE (CATETER) - CVC JE - SANGUE (CATETER) CVC JE
Coletado em: 22/10/2026 13:00
1 - Staphylococcus haemolyticus
2 - Staphylococcus capitis

22/10/2026 16:14:36
Pedido: 20260100492240
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA PARA ANAERÓBIOS - SANGUE PERIFÉRICO - ART FEM DIR - SANGUE PERIFÉRICO ART FEM DIR
Coletado em: 22/10/2026 13:00
1 - Staphylococcus epidermidis
2 - Staphylococcus haemolyticus

19/10/2026 23:50:32
Pedido: 20260100486051
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA AERÓBIA - ESCARRO - - ESCARRO
Coletado em: 19/10/2026 18:00
1 - Flora normal

19/10/2026 23:50:32
Pedido : 20260100486051
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 19/10/2026 18:00
CULTURA PARA FUNGOS - ESCARRO - ,ESCARRO
CULTURA PARA FUNGOS	 	
Candida albicans
Material Biológico entregue ao Laboratório já coletado.
`;

// 3. Exemplo 4 + PDFs (DAMASO): Abscesso Mediastinal polimicrobiano + Bioquímica de líquido pleural (deve ser ignorada) + 2 PDFs
const sampleDamasoCombined = `
26/10/2026 21:31:27
Pedido : 20260100498044
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 26/10/2026 21:32
GLICOSE - LÍQUIDOS - - LQ PLEURAL COL MEDIASTINAL,LÍQUIDOS -LQ PLEURAL COL MEDIASTINAL
GLICOSE	 	393,30 mg/dL	O intervalo de referência para este material biológico não pode ser estabelecido.

17/10/2026 22:08:22
Pedido: 20260100483176
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA AERÓBIA - ABSCESSO - MEDIASTINAL - ABSCESSO MEDIASTINAL
Coletado em: 17/10/2026 18:00
1 - Staphylococcus aureus
2 - Staphylococcus lugdunensis
3 - Streptococcus anginosus group
4 - Klebsiella pneumoniae complex

17/10/2026 22:08:22
Pedido: 20260100483176
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
CULTURA PARA ANAERÓBIOS - ABSCESSO - MEDIASTINAL - ABSCESSO MEDIASTINAL
Coletado em: 17/10/2026 18:00
1 - Veillonella parvula

17/10/2026 22:08:22
Pedido : 20260100483176
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 17/10/2026 18:00
CULTURA PARA FUNGOS - ABSCESSO - MEDIASTINAL,ABSCESSOMEDIASTINAL
CULTURA PARA FUNGOS	 	
Nakaseomyces glabrata (candida glabrata)
CULTURA PARA FUNGOS	 	
Candida albicans
Material Biológico entregue ao Laboratório já coletado.

17/10/2026 22:08:22
Pedido : 20260100483176
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Resultado Parcial
Coletado em: 17/10/2026 18:00
CULTURA PARA MICOBACTÉRIAS - ABSCESSO - MEDIASTINAL,ABSCESSOMEDIASTINAL
CULTURA PARA MICOBACTÉRIAS	 	Parcial Negativa	Negativa

Nome: Registro:
Sexo: Idade:
DAMASO MARCOS DE MOURA
M 065A
27/10/2026 16:34 Emissão:
Folha: 1
Data Nasc.: 11/12/1960
13512253-I
HISTÓRICO DE EXAMES
Valores de Referência Método Resultado
Coletado em: 17/10/2026 18:00
Liberado em: 23/10/2026
15:58:38
20260100483176 - 272887773 - Clínica: E04AA
Negativa Semeadura em meios de cultura
específicos e identificação
manual/Vitek/Maldi Tof.
Microrganismos
1 - Streptococcus anginosus group
2 - Klebsiella pneumoniae complex
3 - Staphylococcus aureus- Staphylococcus lugdunensis
Antibiogramas
1 - Streptococcus anginosus group
Antimicrobiano Classificação/Categoria CIM
CEFEPIME Sensível Dose Padrão
CEFOTAXIME Sensível Dose Padrão
CEFTRIAXONE Sensível Dose Padrão
CLINDAMICINA Sensível Dose Padrão
PENICILINA Consultar observação 0,06
VANCOMICINA Sensível Dose Padrão
2 - Klebsiella pneumoniae complex
Antimicrobiano Classificação/Categoria CIM
AMICACINA Sensível Dose Padrão <= 1
CEFTAZIDIMA/AVIBACTAM Sensível Dose Padrão <= 0,12
CEFTRIAXONA Sensível Dose Padrão <= 0,25
CEFUROXIMA PARENTERAL Sensível Aumentando a exposição 2
MEROPENEM Sensível Dose Padrão <= 0,25
3 - Staphylococcus aureus
Antimicrobiano Classificação/Categoria CIM
CLINDAMICINA Resistente 0,25
DAPTOMICINA Sensível Dose Padrão 0,5
ERITROMICINA Resistente >= 8
LEVOFLOXACINA Sensível Aumentando a exposição <= 0,12
OXACILINA Sensível Dose Padrão <= 0,25
PENICILINA Resistente >= 0,5
VANCOMICINA Sensível Dose Padrão 1
Médicos Responsáveis:DRA VERA LUCIA P. CASTILHO - CRM:28350
Nome: Registro:
DAMASO MARCOS DE MOURA
Folha: 2
HISTÓRICO DE EXAMES
Coletado em: 17/10/2026 18:00
20260100483176 - 272887773 - Clínica: E04AA
Observações:
1. Valor de referência (Penicilina Endocardite): S <= 0,25 mg/L; R >= 0,5 mg/L.

HISTÓRICO DE EXAMES
Coletado em: 17/10/2026 18:00
20260100483176 - 272887772 - Clínica: E04AA
Microrganismos- Veillonella parvula
`;

console.log("Iniciando testes de cultureParser.js...");

// Teste 1: Sample 1 (Kaliane)
const recs1 = mergeAndConsolidateCultures(sampleWeb1);
assert.strictEqual(recs1.length, 3, "Deve consolidar exatamente 3 amostras válidas (ignorando canceladas)");
const text1 = generateCulturesText(recs1, { showMic: true });
console.log("\n--- Saída Teste 1 (Kaliane) ---\n" + text1);
assert(text1.includes("S. maltophilia [S: Levofloxacino (0,25)]"), "Deve vincular a CIM de Levofloxacina ao S. maltophilia");
assert(text1.includes("HMC Periférica (MSD): Negativa"), "Deve consolidar o par Aeróbio/Anaeróbio MSD e ignorar o SE cancelado");
assert(text1.includes("Amostra inadequada (>10 cél. epiteliais/campo)"), "Deve detectar amostra inadequada");

// Teste 2: Sample 3 (Renato)
const recs3 = mergeAndConsolidateCultures(sampleWeb3);
const text3 = generateCulturesText(recs3, { showMic: true });
console.log("\n--- Saída Teste 2 (Renato) ---\n" + text3);
assert(text3.includes("HMC Periférica (Art. Femoral Dir): S. epidermidis + S. haemolyticus"), "Deve vincular frasco irmão idêntico");
assert(text3.includes("HMC Cateter (CVC JE): S. haemolyticus + S. capitis"), "Deve identificar HMC de cateter polimicrobiana");
assert(text3.includes("Escarro: C. albicans"), "Deve capturar Candida albicans em cultura para fungos e ignorar Flora normal redundante");

// Teste 3: Sample 4 + PDFs (Damaso)
const pdfs = parsePdfBlocks(sampleDamasoCombined);
assert.strictEqual(pdfs.length, 2, "Deve extrair 2 PDFs distintos (272887773 e 272887772), unificando Folha 1 e Folha 2");
assert.strictEqual(pdfs[0].organisms.length, 4, "Deve desmembrar '3 - Staphylococcus aureus- Staphylococcus lugdunensis' em 2 microrganismos");
assert.strictEqual(pdfs[1].organisms[0], "Veillonella parvula", "Deve extrair 'Microrganismos- Veillonella parvula'");

const recsDamaso = mergeAndConsolidateCultures(sampleDamasoCombined);
assert.strictEqual(recsDamaso.length, 1, "Deve ignorar Glicose de líquido pleural e consolidar todo o pacote do Abscesso Mediastinal em 1 registro");
const textDamaso = generateCulturesText(recsDamaso, { showMic: true, antibiogramMode: "s_sae_r" });
console.log("\n--- Saída Teste 3 (Damaso Web + PDF) ---\n" + textDamaso);
assert(textDamaso.includes("Abscesso Mediastinal:"), "Deve preservar o nome do material da página web");
assert(textDamaso.includes("S. aureus [S: Daptomicina (0,5), Oxacilina (<=0,25), Vancomicina (1) | SAE: Levofloxacino (<=0,12) | R: Clindamicina (0,25), Eritromicina (>=8), Penicilina (>=0,5)]"), "Deve fundir o TSA do PDF para S. aureus com categorias S, SAE e R + CIM");
assert(textDamaso.includes("K. pneumoniae [S: Amicacina (<=1), Ceftazidima/Avibactam (<=0,12), Ceftriaxona (<=0,25), Meropenem (<=0,25) | SAE: Cefuroxima EV (2)]"), "Deve fundir o TSA do PDF para K. pneumoniae");
assert(textDamaso.includes("Penicilina (0,06)"), "Deve interpretar Penicilina 0,06 no S. anginosus a partir da nota de rodapé do PDF");
assert(textDamaso.includes("Anaeróbios: V. parvula"), "Deve incluir o anaeróbio Veillonella parvula");
assert(textDamaso.includes("Fungos: C. glabrata + C. albicans"), "Deve incluir ambos os fungos isolados");

// Teste 4: Ordem Invertida (PDFs colados ANTES da página web e intercalados)
const pdfPartOnly = sampleDamasoCombined.slice(sampleDamasoCombined.indexOf("Nome: Registro:"));
const webPartOnly = sampleDamasoCombined.slice(0, sampleDamasoCombined.indexOf("Nome: Registro:"));
const reversedInput = `${pdfPartOnly}\n\n${webPartOnly}`;
const recsReversed = mergeAndConsolidateCultures(reversedInput);
const textReversed = generateCulturesText(recsReversed, { showMic: true, antibiogramMode: "s_sae_r" });
assert.strictEqual(
  textReversed,
  textDamaso,
  "A saída deve ser 100% idêntica independentemente da ordem em que o PDF e a página web forem colados"
);

// Teste 5: Diagnósticos de Amostras Canceladas, PDFs Pendentes, PDFs Sem Página Web e Amostras Não Identificadas
assert.strictEqual(
  recs1.diagnostics.cancelledBlocks.length,
  1,
  "Deve registrar o exame cancelado no diagnóstico da Kaliane"
);
assert.strictEqual(
  recs3.diagnostics.missingPdfWarnings.length,
  2,
  "Deve alertar sobre as 2 culturas positivas do Renato que apontam para PDF pendente"
);
assert.strictEqual(
  recsDamaso.diagnostics.missingPdfWarnings.length,
  0,
  "Não deve haver aviso de PDF pendente quando os PDFs do Damaso já foram colados"
);

const recsPdfOnly = mergeAndConsolidateCultures(pdfPartOnly);
assert.strictEqual(
  recsPdfOnly.diagnostics.unmatchedPdfWarnings.length,
  2,
  "Deve alertar quando PDFs são colados sem o bloco da página web correspondente"
);

const sampleUnparsed = `
Pedido : 20260199999999
DIVISÃO DE LABORATÓRIO CENTRAL HCFMUSP
Coletado em: 26/10/2026 10:00
CULTURA ESPECIAL DESCONHECIDA - FRAGMENTO DE TECIDO
Texto truncado sem resultado padronizado
`;
const recsUnparsed = mergeAndConsolidateCultures(sampleUnparsed);
assert.strictEqual(
  recsUnparsed.diagnostics.unparsedBlocks.length,
  1,
  "Deve alertar quando um bloco microbiológico não puder ser identificado/lido"
);

// Teste 6: Padrão inicial sem exibir MIC (showMic = false por padrão)
const textDamasoDefault = generateCulturesText(recsDamaso);
assert(
  textDamasoDefault.includes("S. aureus [S: Daptomicina, Oxacilina, Vancomicina | SAE: Levofloxacino | R: Clindamicina, Eritromicina, Penicilina]"),
  "Por padrão (sem showMic), deve gerar o antibiograma limpo sem os valores numéricos de MIC"
);
assert(
  recsDamaso[0].categoryKey.startsWith("ABSCESSO"),
  "Deve preservar categoryKey no registro consolidado para coloração do card por material"
);

console.log("\nTodos os testes de cultureParser.js (incluindo diagnósticos de amostras não lidas/pendentes e padrão sem MIC) passaram com sucesso!");

