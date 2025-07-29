-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela principal para armazenar as substâncias pesquisadas
CREATE TABLE IF NOT EXISTS substances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    cas_number VARCHAR(50),
    dcb_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os produtos de degradação
CREATE TABLE IF NOT EXISTS degradation_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    degradation_route TEXT NOT NULL,
    environmental_conditions TEXT NOT NULL,
    toxicity_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as referências bibliográficas (usando aspas duplas)
CREATE TABLE IF NOT EXISTS "references" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    reference_text TEXT NOT NULL,
    reference_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar histórico de pesquisas (analytics)
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    search_term VARCHAR(255) NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_substances_name ON substances(name);
CREATE INDEX IF NOT EXISTS idx_substances_cas_number ON substances(cas_number);
CREATE INDEX IF NOT EXISTS idx_degradation_products_substance_id ON degradation_products(substance_id);
CREATE INDEX IF NOT EXISTS idx_references_substance_id ON "references"(substance_id);
CREATE INDEX IF NOT EXISTS idx_references_order ON "references"(substance_id, reference_order);
CREATE INDEX IF NOT EXISTS idx_search_history_substance_id ON search_history(substance_id);
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(search_timestamp);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela substances
CREATE TRIGGER update_substances_updated_at 
    BEFORE UPDATE ON substances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas para documentação
COMMENT ON TABLE substances IS 'Tabela principal para armazenar informações das substâncias ativas pesquisadas';
COMMENT ON TABLE degradation_products IS 'Tabela para armazenar os produtos de degradação de cada substância';
COMMENT ON TABLE "references" IS 'Tabela para armazenar as referências bibliográficas de cada substância';
COMMENT ON TABLE search_history IS 'Tabela para armazenar histórico de pesquisas para analytics';

COMMENT ON COLUMN substances.name IS 'Nome da substância (normalizado para busca)';
COMMENT ON COLUMN substances.cas_number IS 'Número CAS da substância';
COMMENT ON COLUMN substances.dcb_name IS 'Nome conforme DCB (Denominação Comum Brasileira)';
COMMENT ON COLUMN degradation_products.product_name IS 'Nome do produto de degradação formado';
COMMENT ON COLUMN degradation_products.degradation_route IS 'Via de degradação química';
COMMENT ON COLUMN degradation_products.environmental_conditions IS 'Condições ambientais que favorecem a degradação';
COMMENT ON COLUMN degradation_products.toxicity_data IS 'Dados de toxicidade do produto de degradação';
COMMENT ON COLUMN "references".reference_text IS 'Texto completo da referência bibliográfica';
COMMENT ON COLUMN "references".reference_order IS 'Ordem da referência na lista (1, 2, 3...)';
