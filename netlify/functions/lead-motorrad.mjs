export default async (req) => {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    });

  if (req.method !== "POST") {
    return json(
      {
        success: false,
        message: "Método não permitido."
      },
      405
    );
  }

  try {
    const body = await req.json();

    const required = [
      "nome",
      "email",
      "whatsapp",
      "acompanhante"
    ];

    const missing = required.filter(field => !body[field]);

    if (missing.length) {
      return json(
        {
          success: false,
          message: "Preencha todos os campos obrigatórios."
        },
        400
      );
    }

    if (
      body.acompanhante === "Sim" &&
      !body.nome_acompanhante
    ) {
      return json(
        {
          success: false,
          message: "Informe o nome do acompanhante."
        },
        400
      );
    }

    // =====================================================
    // RD STATION
    // =====================================================

    const apiKey = Netlify.env.get("RD_API_KEY");

    if (!apiKey) {
      console.error("RD_API_KEY não configurada.");

      return json(
        {
          success: false,
          message: "Integração com RD ainda não configurada."
        },
        500
      );
    }

    const rdPayload = {
      event_type: "CONVERSION",
      event_family: "CDP",

      payload: {
        conversion_identifier:
          "bmw_motorrad_sunset_mii_2026",

        name: body.nome,
        email: body.email,
        personal_phone: body.whatsapp,

        cf_motorrad_sunset_acompanhante:
          body.acompanhante,

        cf_motorrad_sunset_nome_acompanhante:
          body.nome_acompanhante || "Não informado",

        cf_motorrad_sunset_vendedor:
          body.vendedor || "Não informado",

        tags: [
          "bmw_motorrad",
          "sunset_mii_rooftop",
          "evento_2026"
        ],

        traffic_source:
          body.utm_source || undefined,

        client_tracking_id:
          body.client_id || undefined
      }
    };

    // Remove campos vazios ou indefinidos
    Object.keys(rdPayload.payload).forEach(key => {
      if (
        rdPayload.payload[key] === undefined ||
        rdPayload.payload[key] === ""
      ) {
        delete rdPayload.payload[key];
      }
    });

    const rdResponse = await fetch(
      "https://api.rd.services/platform/conversions?api_key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rdPayload)
      }
    );

    const rdText = await rdResponse.text();

    if (!rdResponse.ok) {
      console.error(
        "RD Station retornou erro:",
        rdResponse.status,
        rdText
      );

      return json(
        {
          success: false,
          message:
            "A inscrição não pôde ser enviada ao RD Station."
        },
        502
      );
    }

    console.log(
      "Lead enviado ao RD Station com sucesso:",
      rdText
    );

    // =====================================================
    // GOOGLE SHEETS
    // =====================================================

    const sheetUrl =
      "https://script.google.com/macros/s/AKfycbybPa3DrtayGYBg2khxUhY_Cll2L1LhTk15_W8Tvg7OSzP-eKoqA6edvDKI4jaj-gsiJw/exec";

    let sheetSent = false;

    try {
      const sheetResponse = await fetch(sheetUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          nome: body.nome || "",
          email: body.email || "",
          whatsapp: body.whatsapp || "",
          acompanhante: body.acompanhante || "",
          nome_acompanhante:
            body.nome_acompanhante || "",
          vendedor: body.vendedor || "",

          utm_source: body.utm_source || "",
          utm_medium: body.utm_medium || "",
          utm_campaign: body.utm_campaign || "",
          utm_content: body.utm_content || "",
          utm_term: body.utm_term || "",

          landing_page_url:
            body.landing_page_url || "",

          referrer: body.referrer || ""
        })
      });

      const sheetText = await sheetResponse.text();

      if (sheetResponse.ok) {
        sheetSent = true;

        console.log(
          "Lead registrado no Google Sheets com sucesso:",
          sheetText
        );
      } else {
        console.error(
          "Google Sheets retornou erro:",
          sheetResponse.status,
          sheetText
        );
      }

    } catch (sheetError) {
      console.error(
        "Erro na integração com Google Sheets:",
        sheetError
      );
    }

    // =====================================================
    // RESPOSTA FINAL
    // =====================================================

    console.log("Lead Motorrad processado:", {
      email: body.email,
      rdSent: true,
      sheetSent: sheetSent
    });

    return json({
      success: true,
      rd_sent: true,
      sheet_sent: sheetSent
    });

  } catch (error) {
    console.error(
      "Erro na função lead-motorrad:",
      error
    );

    return json(
      {
        success: false,
        message:
          "Erro interno ao processar a inscrição."
      },
      500
    );
  }
};
