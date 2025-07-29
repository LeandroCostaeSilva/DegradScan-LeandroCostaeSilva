-- Verificar se todas as tabelas existem e criar se necessário
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

-- Tabela para armazenar as referências bibliográficas
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
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_response_cached BOOLEAN DEFAULT FALSE,
    response_source VARCHAR(50) DEFAULT 'unknown' -- 'ai', 'mock', 'cache'
);

-- Tabela para armazenar respostas completas da API (para auditoria)
CREATE TABLE IF NOT EXISTS api_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    search_term VARCHAR(255) NOT NULL,
    response_data JSONB NOT NULL,
    response_source VARCHAR(50) NOT NULL, -- 'gemini', 'mock'
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_substances_name ON substances(name);
CREATE INDEX IF NOT EXISTS idx_substances_dcb_name ON substances(dcb_name);
CREATE INDEX IF NOT EXISTS idx_substances_cas_number ON substances(cas_number);
CREATE INDEX IF NOT EXISTS idx_degradation_products_substance_id ON degradation_products(substance_id);
CREATE INDEX IF NOT EXISTS idx_references_substance_id ON "references"(substance_id);
CREATE INDEX IF NOT EXISTS idx_references_order ON "references"(substance_id, reference_order);
CREATE INDEX IF NOT EXISTS idx_search_history_substance_id ON search_history(substance_id);
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_responses_substance_id ON api_responses(substance_id);
CREATE INDEX IF NOT EXISTS idx_api_responses_timestamp ON api_responses(created_at);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela substances
DROP TRIGGER IF EXISTS update_substances_updated_at ON substances;
CREATE TRIGGER update_substances_updated_at 
    BEFORE UPDATE ON substances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando tabelas criadas:';
    RAISE NOTICE 'substances: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'substances');
    RAISE NOTICE 'degradation_products: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'degradation_products');
    RAISE NOTICE 'references: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'references');
    RAISE NOTICE 'search_history: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'search_history');
    RAISE NOTICE 'api_responses: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'api_responses');
END $$;
