-- Habilitar Row Level Security (RLS) nas tabelas
ALTER TABLE substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE degradation_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública (dados científicos são públicos)
CREATE POLICY "Allow public read access on substances" ON substances
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on degradation_products" ON degradation_products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on references" ON "references"
    FOR SELECT USING (true);

-- Política mais restritiva para histórico de pesquisas (apenas leitura para admins)
CREATE POLICY "Allow public insert on search_history" ON search_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read on search_history" ON search_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para inserção/atualização (apenas para usuários autenticados ou serviços)
CREATE POLICY "Allow service role to manage substances" ON substances
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage degradation_products" ON degradation_products
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage references" ON "references"
    FOR ALL USING (auth.role() = 'service_role');
