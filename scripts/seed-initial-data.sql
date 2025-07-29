-- Inserir dados iniciais para as substâncias já implementadas no mock

-- Inserir Paracetamol
INSERT INTO substances (name, cas_number, dcb_name) 
VALUES ('paracetamol', '103-90-2', 'Paracetamol')
ON CONFLICT (name) DO NOTHING;

-- Obter o ID do paracetamol para usar nas próximas inserções
DO $$
DECLARE
    paracetamol_id UUID;
BEGIN
    SELECT id INTO paracetamol_id FROM substances WHERE name = 'paracetamol';
    
    -- Inserir produtos de degradação do paracetamol
    INSERT INTO degradation_products (substance_id, product_name, degradation_route, environmental_conditions, toxicity_data) VALUES
    (paracetamol_id, 'N-acetil-p-benzoquinona imina (NAPQI)', 'Oxidação metabólica via CYP2E1', 'pH fisiológico, presença de oxigênio, temperatura corporal (37°C)', 'Altamente hepatotóxico, responsável pela toxicidade do paracetamol em overdose'),
    (paracetamol_id, 'p-aminofenol', 'Hidrólise da ligação amida', 'pH ácido (< 4), temperatura elevada (> 60°C), umidade alta', 'Moderadamente tóxico, pode causar metahemoglobinemia e nefrotoxicidade'),
    (paracetamol_id, 'Ácido p-hidroxibenzóico', 'Oxidação do grupo amino seguida de desaminação', 'Presença de oxidantes, luz UV, pH alcalino (> 8)', 'Baixa toxicidade, usado como conservante alimentar (E-214)');
    
    -- Inserir referências do paracetamol
    INSERT INTO "references" (substance_id, reference_text, reference_order) VALUES
    (paracetamol_id, 'Larson, A. M., et al. (2005). Acetaminophen-induced acute liver failure: results of a United States multicenter, prospective study. Hepatology, 42(6), 1364-1372.', 1),
    (paracetamol_id, 'McGill, M. R., & Jaeschke, H. (2013). Metabolism and disposition of acetaminophen: recent advances in relation to hepatotoxicity and diagnosis. Pharmaceutical research, 30(9), 2174-2187.', 2),
    (paracetamol_id, 'Prescott, L. F. (2000). Paracetamol, alcohol and the liver. British journal of clinical pharmacology, 49(4), 291-301.', 3),
    (paracetamol_id, 'Dahlin, D. C., et al. (1984). N-acetyl-p-benzoquinone imine: a cytochrome P-450-mediated oxidation product of acetaminophen. Proceedings of the National Academy of Sciences, 81(5), 1327-1331.', 4);
END $$;

-- Inserir Ibuprofeno
INSERT INTO substances (name, cas_number, dcb_name) 
VALUES ('ibuprofeno', '15687-27-1', 'Ibuprofeno')
ON CONFLICT (name) DO NOTHING;

-- Obter o ID do ibuprofeno para usar nas próximas inserções
DO $$
DECLARE
    ibuprofeno_id UUID;
BEGIN
    SELECT id INTO ibuprofeno_id FROM substances WHERE name = 'ibuprofeno';
    
    -- Inserir produtos de degradação do ibuprofeno
    INSERT INTO degradation_products (substance_id, product_name, degradation_route, environmental_conditions, toxicity_data) VALUES
    (ibuprofeno_id, 'Ácido 2-[4-(2-carboxipropil)fenil]propiônico', 'Oxidação da cadeia lateral isobutílica', 'pH neutro (6-8), presença de oxigênio, catálise enzimática (CYP2C9)', 'Toxicidade renal moderada, menor nefrotoxicidade que o composto original'),
    (ibuprofeno_id, '4-isobutilfenol', 'Descarboxilação térmica', 'Temperatura elevada (> 80°C), pH ácido (< 3), ausência de água', 'Potencial irritante dérmico e ocular, dados limitados de toxicidade sistêmica'),
    (ibuprofeno_id, 'Ácido 2-[4-(1-hidroxi-2-metilpropil)fenil]propiônico', 'Hidroxilação da cadeia lateral', 'Presença de enzimas CYP, pH fisiológico, temperatura corporal', 'Perfil de toxicidade similar ao ibuprofeno, menor atividade anti-inflamatória');
    
    -- Inserir referências do ibuprofeno
    INSERT INTO "references" (substance_id, reference_text, reference_order) VALUES
    (ibuprofeno_id, 'Davies, N. M. (1998). Clinical pharmacokinetics of ibuprofen. Clinical pharmacokinetics, 34(2), 101-154.', 1),
    (ibuprofeno_id, 'Rainsford, K. D. (2009). Ibuprofen: pharmacology, efficacy and safety. Inflammopharmacology, 17(6), 275-342.', 2),
    (ibuprofeno_id, 'Mazaleuskaya, L. L., et al. (2015). PharmGKB summary: ibuprofen pathways. Pharmacogenetics and genomics, 25(2), 96-106.', 3);
END $$;
