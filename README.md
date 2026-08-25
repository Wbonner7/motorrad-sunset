# LP BMW Motorrad Sunset MII Rooftop 2026

Pacote preparado com a mesma arquitetura técnica da LP Jeep Avenger, adaptada para a campanha BMW Motorrad Sunset MII Rooftop.

## Arquivos

- `index.html`, landing page
- `obrigado.html`, confirmação
- `netlify/functions/lead-motorrad.mjs`, integração segura com RD Station
- `netlify.toml`, configuração do Netlify
- `campaign-config.json`, parâmetros da campanha
- `assets/`, imagens usadas na LP

## RD Station

No Netlify, configure a variável:

`RD_API_KEY`

A função envia a conversão para:

`POST https://api.rd.services/platform/conversions`

Conversion identifier:

`bmw_motorrad_sunset_mii_2026`

Campos personalizados esperados:

`cf_motorrad_sunset_acompanhante`
`cf_motorrad_sunset_nome_acompanhante`
`cf_motorrad_sunset_vendedor`

Esses campos precisam existir no RD Station com esses identificadores antes do teste final.

## Planilha

O pacote suporta um webhook opcional para a planilha:

`SHEETS_WEBHOOK_URL`

Se essa variável não for configurada, o lead continua sendo enviado ao RD normalmente.

O ZIP técnico do Jeep que usamos como referência contém integração direta com RD, mas não contém uma função específica de planilha. Por isso não inventei um endpoint de planilha, deixei o ponto de integração preparado.

## GTM

No `index.html`, substitua:

`GTM-XXXXXXX`

pelo ID real do container.

Eventos:

`lp_view`
`cta_click`
`form_start`
`generate_lead`
`lead_rdstation_success`
`lead_submit_error`
`thank_you_view`

## UTM

A LP captura:

`utm_source`
`utm_medium`
`utm_campaign`
`utm_content`
`utm_term`

Também envia:

`landing_page_url`
`referrer`

## Formulário

Campos:

Nome completo
E-mail
WhatsApp
Vendedor BMW Motorrad Osten
Você levará 1 acompanhante?
Nome do acompanhante

Se o visitante marcar "Sim", o nome do acompanhante passa a ser obrigatório.

## Publicação

Suba a pasta inteira no Netlify, mantendo `index.html`, `obrigado.html`, `netlify/functions` e `assets`.

Não abra somente o `index.html` pelo computador para testar o formulário, pois a Netlify Function só existe quando o projeto está sendo servido pelo Netlify.

Antes do disparo oficial, faça um cadastro de teste e valide o contato no RD Station.
