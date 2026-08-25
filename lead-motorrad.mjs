export default async (req) => {
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type": "application/json"}
  });

  if (req.method !== "POST") {
    return json({success:false, message:"Método não permitido."}, 405);
  }

  try {
    const body = await req.json();

    const required = ["nome", "email", "whatsapp", "acompanhante"];
    const missing = required.filter(field => !body[field]);

    if (missing.length) {
      return json({
        success:false,
        message:"Preencha todos os campos obrigatórios."
      }, 400);
    }

    if (body.acompanhante === "Sim" && !body.nome_acompanhante) {
      return json({
        success:false,
        message:"Informe o nome do acompanhante."
      }, 400);
    }

    const apiKey = Netlify.env.get("RD_API_KEY");

    if (!apiKey) {
      console.error("RD_API_KEY não configurada.");
      return json({
        success:false,
        message:"Integração ainda não configurada."
      }, 500);
    }

    const payload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: "bmw_motorrad_sunset_mii_2026",
        name: body.nome,
        email: body.email,
        personal_phone: body.whatsapp,

        cf_motorrad_sunset_acompanhante: body.acompanhante,
        cf_motorrad_sunset_nome_acompanhante: body.nome_acompanhante || "Não informado",
        cf_motorrad_sunset_vendedor: body.vendedor || "Não informado",

        tags: [
          "bmw_motorrad",
          "sunset_mii_rooftop",
          "evento_2026"
        ],

        traffic_source: body.utm_source || undefined,
        client_tracking_id: body.client_id || undefined
      }
    };

    Object.keys(payload.payload).forEach(key => {
      if (payload.payload[key] === undefined || payload.payload[key] === "") {
        delete payload.payload[key];
      }
    });

    const rdResponse = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      }
    );

    const rdText = await rdResponse.text();

    if (!rdResponse.ok) {
      console.error("RD Station retornou erro:", rdResponse.status, rdText);
      return json({
        success:false,
        message:"A inscrição não pôde ser enviada ao RD Station."
      }, 502);
    }

    // Integração opcional com planilha/webhook.
    // Se não estiver configurada, o envio ao RD continua normalmente.
    let sheetSent = false;
    const sheetUrl = Netlify.env.get("SHEETS_WEBHOOK_URL");

    if (sheetUrl) {
      try {
        const sheetResponse = await fetch(sheetUrl, {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            data_cadastro: new Date().toISOString(),
            campanha: "bmw_motorrad_sunset_mii_2026",
            nome: body.nome,
            email: body.email,
            whatsapp: body.whatsapp,
            acompanhante: body.acompanhante,
            nome_acompanhante: body.nome_acompanhante || "",
            vendedor: body.vendedor || "",
            utm_source: body.utm_source || "",
            utm_medium: body.utm_medium || "",
            utm_campaign: body.utm_campaign || "",
            utm_content: body.utm_content || "",
            utm_term: body.utm_term || "",
            landing_page_url: body.landing_page_url || "",
            referrer: body.referrer || ""
          })
        });

        sheetSent = sheetResponse.ok;

        if (!sheetResponse.ok) {
          console.error("Webhook da planilha retornou erro:", await sheetResponse.text());
        }
      } catch (sheetError) {
        console.error("Erro no webhook da planilha:", sheetError);
      }
    }

    console.log("Lead Motorrad enviado:", {
      email: body.email,
      sheetSent
    });

    return json({
      success:true,
      sheet_sent: sheetSent
    });
  } catch (error) {
    console.error("Erro na função lead-motorrad:", error);
    return json({
      success:false,
      message:"Erro interno ao processar a inscrição."
    }, 500);
  }
};
