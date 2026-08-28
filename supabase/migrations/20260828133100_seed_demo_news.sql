-- Seed: notícias de demonstração para o projeto Notícias Laguna
-- Todas marcadas com is_demo = true

DO $$
DECLARE
  v_project_id uuid;
  v_category_transito uuid;
  v_category_prefeitura uuid;
  v_category_eventos uuid;
  v_category_clima uuid;
  v_category_cidade uuid;
  v_category_turismo uuid;
  v_category_saude uuid;
  v_category_educacao uuid;
  v_news_1 uuid;
  v_news_2 uuid;
  v_news_3 uuid;
  v_news_4 uuid;
  v_news_5 uuid;
  v_news_6 uuid;
  v_news_7 uuid;
  v_news_8 uuid;
  v_news_9 uuid;
  v_news_10 uuid;
BEGIN
  -- Buscar o projeto
  SELECT id INTO v_project_id FROM public.projects WHERE name = 'Projeto Notícias Laguna' LIMIT 1;
  IF v_project_id IS NULL THEN
    RAISE NOTICE 'Projeto não encontrado, pulando seed de notícias demo.';
    RETURN;
  END IF;

  -- Buscar categorias (criar se não existirem)
  SELECT id INTO v_category_transito FROM public.categories WHERE slug = 'transito' AND project_id = v_project_id LIMIT 1;
  IF v_category_transito IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Trânsito', 'transito', true) RETURNING id INTO v_category_transito;
  END IF;

  SELECT id INTO v_category_prefeitura FROM public.categories WHERE slug = 'prefeitura' AND project_id = v_project_id LIMIT 1;
  IF v_category_prefeitura IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Prefeitura', 'prefeitura', true) RETURNING id INTO v_category_prefeitura;
  END IF;

  SELECT id INTO v_category_eventos FROM public.categories WHERE slug = 'eventos' AND project_id = v_project_id LIMIT 1;
  IF v_category_eventos IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Eventos', 'eventos', true) RETURNING id INTO v_category_eventos;
  END IF;

  SELECT id INTO v_category_clima FROM public.categories WHERE slug = 'clima' AND project_id = v_project_id LIMIT 1;
  IF v_category_clima IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Clima', 'clima', true) RETURNING id INTO v_category_clima;
  END IF;

  SELECT id INTO v_category_cidade FROM public.categories WHERE slug = 'cidade' AND project_id = v_project_id LIMIT 1;
  IF v_category_cidade IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Cidade', 'cidade', true) RETURNING id INTO v_category_cidade;
  END IF;

  SELECT id INTO v_category_turismo FROM public.categories WHERE slug = 'turismo' AND project_id = v_project_id LIMIT 1;
  IF v_category_turismo IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Turismo', 'turismo', true) RETURNING id INTO v_category_turismo;
  END IF;

  SELECT id INTO v_category_saude FROM public.categories WHERE slug = 'saude' AND project_id = v_project_id LIMIT 1;
  IF v_category_saude IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Saúde', 'saude', true) RETURNING id INTO v_category_saude;
  END IF;

  SELECT id INTO v_category_educacao FROM public.categories WHERE slug = 'educacao' AND project_id = v_project_id LIMIT 1;
  IF v_category_educacao IS NULL THEN
    INSERT INTO public.categories (project_id, name, slug, active) VALUES (v_project_id, 'Educação', 'educacao', true) RETURNING id INTO v_category_educacao;
  END IF;

  -- Gerar UUIDs para as notícias
  v_news_1 := gen_random_uuid();
  v_news_2 := gen_random_uuid();
  v_news_3 := gen_random_uuid();
  v_news_4 := gen_random_uuid();
  v_news_5 := gen_random_uuid();
  v_news_6 := gen_random_uuid();
  v_news_7 := gen_random_uuid();
  v_news_8 := gen_random_uuid();
  v_news_9 := gen_random_uuid();
  v_news_10 := gen_random_uuid();

  -- Inserir notícias demo
  INSERT INTO public.news (id, project_id, category_id, title, original_content, source_url, city, state, importance_score, ai_confidence, is_duplicate, duplicate_group_id, status, discovered_at, is_demo)
  VALUES
    (v_news_1, v_project_id, v_category_transito,
     'Acidente causa lentidão em trecho da BR-101 em Laguna',
     'Uma colisão entre dois veículos de passeio foi registrada no km 320 da BR-101, em Laguna, no início da manhã. Segundo a concessionária, uma faixa foi bloqueada para atendimento e o trânsito segue lento no sentido sul. Não houve vítimas graves. Equipes trabalham na remoção dos veículos.',
     'https://exemplo.com/br101-lentidao', 'Laguna', 'SC', 9, 96, false, 'dup-br101-km320',
     'awaiting_approval', now() - interval '3 hours', true),

    (v_news_2, v_project_id, v_category_prefeitura,
     'Prefeitura de Laguna anuncia nova ação de revitalização urbana',
     'A Prefeitura de Laguna anunciou uma nova ação de revitalização urbana que contempla a recuperação de calçadas, troca de iluminação pública e paisagismo em ruas do centro. Segundo a administração, os trabalhos começam no próximo mês e devem durar cerca de 90 dias.',
     'https://exemplo.com/prefeitura-revitalizacao', 'Laguna', 'SC', 6, 91, false, null,
     'new', now() - interval '2 hours 45 minutes', true),

    (v_news_3, v_project_id, v_category_eventos,
     'Evento movimenta o centro histórico de Laguna neste fim de semana',
     'O centro histórico de Laguna recebe neste fim de semana uma feira cultural com apresentações musicais, artesanato local e praça de alimentação. A programação acontece na Praça República Juliana, das 10h às 22h, com entrada gratuita.',
     'https://exemplo.com/centro-historico-evento', 'Laguna', 'SC', 5, 88, false, null,
     'approved', now() - interval '2 hours 30 minutes', true),

    (v_news_4, v_project_id, v_category_clima,
     'Defesa Civil emite alerta de ventos fortes para a região de Laguna',
     'A Defesa Civil de Santa Catarina emitiu alerta de ventos fortes para o litoral sul, incluindo Laguna. A previsão indica rajadas de até 70 km/h até a noite desta quarta-feira. A recomendação é evitar áreas de praia e não se abrigar sob árvores.',
     'https://exemplo.com/alerta-ventos', 'Laguna', 'SC', 10, 98, false, null,
     'published', now() - interval '6 hours', true),

    (v_news_5, v_project_id, v_category_transito,
     'Alteração no trânsito na região do Mercado Público de Laguna',
     'A Secretaria de Mobilidade informou que a rua lateral ao Mercado Público passará a ter sentido único a partir de segunda-feira. A mudança busca melhorar o fluxo de veículos e ampliar o espaço para pedestres na região.',
     'https://exemplo.com/alteracao-transito', 'Laguna', 'SC', 8, 94, false, null,
     'awaiting_approval', now() - interval '1 hour 30 minutes', true),

    (v_news_6, v_project_id, v_category_cidade,
     'Praia do Mar Grosso recebe ação de limpeza com voluntários',
     'Um mutirão de limpeza reuniu voluntários na Praia do Mar Grosso, em Laguna. A ação recolheu cerca de 300 kg de resíduos e teve apoio de escolas da região.',
     'https://exemplo.com/limpeza-mar-grosso', 'Laguna', 'SC', 3, 82, false, null,
     'published', now() - interval '1 day 2 hours', true),

    (v_news_7, v_project_id, v_category_turismo,
     'Turismo em Laguna cresce com procura por roteiros históricos',
     'Operadores de turismo de Laguna registram aumento na procura por roteiros históricos, especialmente visitas guiadas ao centro histórico e à Casa de Anita Garibaldi.',
     'https://exemplo.com/turismo-laguna', 'Laguna', 'SC', 2, 71, false, null,
     'ignored', now() - interval '1 day 4 hours', true),

    (v_news_8, v_project_id, v_category_transito,
     'Acidente na BR-101 deixa trânsito lento próximo a Laguna',
     'Motoristas relatam lentidão na BR-101 na altura de Laguna após colisão entre dois carros. O trecho é o mesmo já reportado por outra fonte.',
     'https://exemplo.com/br101-duplicada', 'Laguna', 'SC', 8, 65, true, 'dup-br101-km320',
     'duplicate', now() - interval '2 hours 50 minutes', true),

    (v_news_9, v_project_id, v_category_saude,
     'Posto de saúde do bairro Magalhães amplia horário de atendimento',
     'A unidade de saúde do bairro Magalhães, em Laguna, passará a funcionar até as 20h de segunda a sexta. A ampliação atende pedido de moradores e começa na próxima semana.',
     'https://exemplo.com/saude-magalhaes', 'Laguna', 'SC', 6, 58, false, null,
     'review_required', now() - interval '1 hour', true),

    (v_news_10, v_project_id, v_category_educacao,
     'Escolas municipais de Laguna abrem matrículas para novo semestre',
     'As escolas da rede municipal de Laguna abriram o período de matrículas para o novo semestre. O atendimento acontece nas secretarias das unidades, das 8h às 17h.',
     'https://exemplo.com/matriculas', 'Laguna', 'SC', 6, 90, false, null,
     'published', now() - interval '2 days 1 hour', true);

  -- Inserir análises (news_analysis) para cada notícia demo
  INSERT INTO public.news_analysis (news_id, summary, instagram_title, instagram_caption, hashtags, suggested_art_text, moderation_status, moderation_notes)
  VALUES
    (v_news_1,
     'Colisão no km 320 da BR-101, sentido sul, bloqueou uma faixa e deixou o trânsito lento na manhã desta quarta.',
     'BR-101: acidente deixa trânsito lento em Laguna',
     '🚨 TRÂNSITO | Acidente no km 320 da BR-101, em Laguna, deixa o trânsito lento no sentido sul nesta manhã. Uma faixa está bloqueada para atendimento. Redobre a atenção ao passar pelo trecho.',
     '#laguna #br101 #transito #lagunasc #noticiaslaguna',
     'ACIDENTE NA BR-101\nTrânsito lento em Laguna',
     'approved',
     'Classificada como urgente porque envolve acidente com bloqueio de faixa em rodovia federal que corta a cidade, com impacto imediato no deslocamento dos moradores.'),

    (v_news_2,
     'Prefeitura anuncia revitalização no centro com novas calçadas, iluminação e paisagismo a partir do próximo mês.',
     'Centro de Laguna terá calçadas e iluminação renovadas',
     '🏛️ PREFEITURA | Laguna anuncia revitalização no centro: calçadas recuperadas, nova iluminação e paisagismo. Início previsto para o próximo mês.',
     '#laguna #prefeituradelaguna #centrohistorico #lagunasc',
     'REVITALIZAÇÃO NO CENTRO\nCalçadas e nova iluminação',
     'approved',
     'Importância média: é um anúncio oficial da Prefeitura com impacto no centro da cidade, mas sem urgência imediata para o dia de hoje.'),

    (v_news_3,
     'Feira com música, artesanato e gastronomia ocupa a Praça República Juliana de sexta a domingo, das 10h às 22h.',
     'Feira cultural agita o centro histórico de Laguna',
     '🎉 EVENTOS | Música, artesanato e gastronomia no centro histórico de Laguna neste fim de semana. Entrada gratuita, das 10h às 22h.',
     '#laguna #eventoslaguna #centrohistorico #culturasc',
     'FEIRA CULTURAL\nCentro histórico de Laguna',
     'approved',
     'Importância média porque é um evento cultural com data definida no centro histórico, de interesse geral, mas sem caráter de alerta.'),

    (v_news_4,
     'Defesa Civil alerta para rajadas de até 70 km/h no litoral sul, incluindo Laguna, até a noite desta quarta.',
     'Alerta: ventos de até 70 km/h em Laguna',
     '⚠️ ALERTA | Defesa Civil prevê rajadas de até 70 km/h em Laguna e região até a noite. Evite praias e não se abrigue sob árvores.',
     '#laguna #defesacivil #alerta #clima #lagunasc',
     'ALERTA DE VENTOS FORTES\nRajadas de até 70 km/h',
     'approved',
     'Classificada como urgente porque é um alerta oficial da Defesa Civil com risco à segurança da população e validade para hoje.'),

    (v_news_5,
     'Rua lateral ao Mercado Público passa a ter sentido único a partir de segunda-feira, segundo a Secretaria de Mobilidade.',
     'Rua do Mercado Público terá sentido único em Laguna',
     '🚦 TRÂNSITO | Atenção, Laguna: a rua lateral ao Mercado Público passa a ter sentido único a partir de segunda-feira. A mudança busca melhorar o fluxo e ampliar o espaço para pedestres.',
     '#laguna #transito #mercadopublico #lagunasc',
     'MUDANÇA NO TRÂNSITO\nRua do Mercado Público',
     'approved',
     'A notícia foi classificada como alta importância porque informa uma alteração no trânsito em uma via central da cidade, afetando a rotina de quem circula pela região.'),

    (v_news_6,
     'Voluntários recolheram cerca de 300 kg de resíduos na orla da Praia do Mar Grosso, com apoio de escolas.',
     'Mutirão recolhe 300 kg de resíduos no Mar Grosso',
     '🌊 CIDADE | Mutirão na Praia do Mar Grosso recolheu cerca de 300 kg de resíduos. Parabéns aos voluntários e às escolas que participaram!',
     '#laguna #margrosso #meioambiente #lagunasc',
     'MUTIRÃO DE LIMPEZA\n300 kg recolhidos no Mar Grosso',
     'approved',
     'Importância baixa: é uma ação comunitária positiva já encerrada, sem impacto direto na rotina ou na segurança dos moradores.'),

    (v_news_7,
     'Guias locais relatam aumento na procura por visitas ao centro histórico e à Casa de Anita Garibaldi.',
     'Roteiros históricos crescem em Laguna',
     '🏛️ TURISMO | Guias de Laguna relatam mais procura por roteiros históricos, com destaque para o centro histórico e a Casa de Anita.',
     '#laguna #turismo #anitagaribaldi #lagunasc',
     'TURISMO HISTÓRICO\nProcura em alta em Laguna',
     'needs_review',
     'Importância baixa e confiança reduzida: o texto traz percepções de guias locais, sem dados oficiais que confirmem o crescimento citado.'),

    (v_news_8,
     'Motoristas relatam lentidão na BR-101 após colisão entre dois carros.',
     'BR-101 com trânsito lento perto de Laguna',
     '🚧 TRÂNSITO | Lentidão na BR-101 na altura de Laguna após colisão entre dois veículos.',
     '#laguna #br101 #transito',
     'BR-101\nTrânsito lento',
     'approved',
     'Marcada como duplicada: descreve o mesmo acidente no km 320 da BR-101 já publicado por outra fonte, com poucas informações novas.'),

    (v_news_9,
     'Unidade do bairro Magalhães passa a atender até as 20h de segunda a sexta a partir da próxima semana.',
     'Posto de saúde do Magalhães amplia horário',
     '🏥 SAÚDE | O posto de saúde do bairro Magalhães, em Laguna, passa a atender até as 20h de segunda a sexta.',
     '#laguna #saude #magalhaes #lagunasc',
     'POSTO DE SAÚDE\nAtendimento até as 20h',
     'needs_review',
     'Marcada para revisão obrigatória: a confiança ficou baixa porque a data de início da ampliação não está clara no texto original.'),

    (v_news_10,
     'Escolas municipais recebem matrículas para o novo semestre por duas semanas, das 8h às 17h.',
     'Matrículas abertas na rede municipal de Laguna',
     '🎓 EDUCAÇÃO | Matrículas abertas nas escolas municipais de Laguna por duas semanas, das 8h às 17h nas secretarias.',
     '#laguna #educacao #matriculas #lagunasc',
     'MATRÍCULAS ABERTAS\nRede municipal de Laguna',
     'approved',
     'Importância média: informação de serviço com prazo definido, útil para famílias da rede municipal de ensino.');

END $$;
