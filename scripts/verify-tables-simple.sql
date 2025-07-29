-- Script simples para verificar se as tabelas estão corretas

-- Listar todas as colunas da tabela search_history
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'search_history'
ORDER BY ordinal_position;

-- Verificar se as novas colunas existem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'search_history' AND column_name = 'api_response_cached'
        ) THEN '✅ api_response_cached EXISTS'
        ELSE '❌ api_response_cached MISSING'
    END as status_cached,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'search_history' AND column_name = 'response_source'
        ) THEN '✅ response_source EXISTS'
        ELSE '❌ response_source MISSING'
    END as status_source;

-- Verificar se tabela api_responses existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'api_responses'
        ) THEN '✅ api_responses table EXISTS'
        ELSE '❌ api_responses table MISSING'
    END as api_responses_status;

-- Contar registros nas tabelas
SELECT 
    (SELECT COUNT(*) FROM substances) as total_substances,
    (SELECT COUNT(*) FROM search_history) as total_searches,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_responses') 
             THEN (SELECT COUNT(*) FROM api_responses)::text 
             ELSE 'table not exists' END) as total_api_responses;
