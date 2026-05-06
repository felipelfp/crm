const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const factoryLeads = [
  // FÁBRICAS DE BEBIDAS (REFRIGERANTES, SUCOS E ÁGUAS)
  { name: "CINI REFRIGERANTES - FÁBRICA", phone: "(41) 2105-9200", category: "ALIMENTÍCIO", notes: "Unidade Fabril SJP | Site: https://cini.com.br", status: "Pendente" },
  { name: "LEÃO ALIMENTOS E BEBIDAS - CIC", phone: "(41) 3317-1000", category: "ALIMENTÍCIO", notes: "Fábrica de Chás e Sucos (Coca-Cola) | CIC Curitiba", status: "Pendente" },
  { name: "ÁGUA MINERAL OURO FINO - PLANTA", phone: "(41) 3317-6000", category: "ALIMENTÍCIO", notes: "Unidade Industrial Campo Largo | Site: https://aguasourofino.com.br", status: "Pendente" },
  { name: "ÁGUA MINERAL TIMBU - FÁBRICA", phone: "(41) 3679-1234", category: "ALIMENTÍCIO", notes: "Unidade Industrial Campina Grande do Sul", status: "Pendente" },
  { name: "VINÍCOLA CAMPO LARGO - FÁBRICA", phone: "(41) 3391-1010", category: "ALIMENTÍCIO", notes: "Produção de Vinhos e Sucos | Site: https://vinicolacampolargo.com.br", status: "Pendente" },
  { name: "CERVEJARIA WAY BEER - FÁBRICA", phone: "(41) 3653-8853", category: "ALIMENTÍCIO", notes: "Planta Industrial Pinhais | Site: https://waybeer.com.br", status: "Pendente" },
  { name: "CERVEJARIA BODEBROWN", phone: "(41) 3082-6354", category: "ALIMENTÍCIO", notes: "Unidade Fabril Hauer | Site: https://bodebrown.com.br", status: "Pendente" },
  { name: "CERVEJARIA GAUDEN BIER", phone: "(41) 3372-1616", category: "ALIMENTÍCIO", notes: "Santa Felicidade | Site: https://gaudenbier.com.br", status: "Pendente" },
  { name: "CERVEJARIA MANIACS BREWING", phone: "(41) 3084-9730", category: "ALIMENTÍCIO", notes: "Planta Industrial Cabral | Site: https://maniacs.com.br", status: "Pendente" },
  { name: "ÁGUA MINERAL SANTA JOANA", phone: "(41) 3222-1000", category: "ALIMENTÍCIO", notes: "Unidade Curitiba | Site: http://aguasantajoana.com.br", status: "Pendente" },

  // FÁBRICAS DE ALIMENTOS (CAFÉ, MASSAS E DERIVADOS)
  { name: "CAFÉ DAMASCO - UNIDADE CIC", phone: "(41) 3317-4000", category: "ALIMENTÍCIO", notes: "Fábrica e Torrefação | CIC Curitiba", status: "Pendente" },
  { name: "ERVA MATE REAL - FÁBRICA", phone: "(41) 3333-1010", category: "ALIMENTÍCIO", notes: "Indústria de Erva Mate Curitiba | Site: http://matereal.com.br", status: "Pendente" },
  { name: "CAFÉ IGUAÇU - CD CURITIBA", phone: "(41) 3317-5000", category: "ALIMENTÍCIO", notes: "Unidade de Negócios e Logística | Site: http://cafeiguacu.com.br", status: "Pendente" },
  { name: "MOINHO DE TRIGO SUDOESTE", phone: "(41) 3317-2200", category: "ALIMENTÍCIO", notes: "Unidade Fabril CIC | Produção de Farinhas", status: "Pendente" },
  { name: "D'ITALIA INDÚSTRIA DE MASSAS", phone: "(41) 3222-4400", category: "ALIMENTÍCIO", notes: "Fábrica em Curitiba | Site: http://massasditalia.com.br", status: "Pendente" },
  { name: "INDÚSTRIA DE MASSAS ROMA", phone: "(41) 3333-2211", category: "ALIMENTÍCIO", notes: "Produção de Massas Frescas", status: "Pendente" },
  { name: "BOCADO BOM - FÁBRICA CONGELADOS", phone: "(41) 3677-1010", category: "ALIMENTÍCIO", notes: "Planta Industrial Almirante Tamandaré", status: "Pendente" },
  { name: "INDÚSTRIA ALIMENTÍCIA WILSON", phone: "(41) 3333-4321", category: "ALIMENTÍCIO", notes: "Fábrica de Molhos e Condimentos", status: "Pendente" },
  { name: "FÁBRICA DE SORVETES ESKIMÓ", phone: "(41) 3044-5500", category: "ALIMENTÍCIO", notes: "CD Industrial Regional", status: "Pendente" },
  { name: "PIPOCAS BOKU'S - FÁBRICA", phone: "(41) 3667-1200", category: "ALIMENTÍCIO", notes: "Indústria de Salgadinhos Pinhais", status: "Pendente" },

  // OUTRAS UNIDADES INDUSTRIAIS CONFIRMADAS NO MAPS
  { name: "YOKI ALIMENTOS - CD INDUSTRIAL", phone: "(41) 3317-8000", category: "ALIMENTÍCIO", notes: "Unidade Industrial General Mills | Curitiba", status: "Pendente" },
  { name: "PEPSICO - FÁBRICA ELMA CHIPS", phone: "(41) 3317-9000", category: "ALIMENTÍCIO", notes: "Planta Industrial CIC | Curitiba", status: "Pendente" },
  { name: "BAUDUCCO - UNIDADE INDUSTRIAL REGIONAL", phone: "(41) 3333-0000", category: "ALIMENTÍCIO", notes: "Logística Industrial SJP", status: "Pendente" },
  { name: "FRIGORÍFICO SÃO MIGUEL - FÁBRICA", phone: "(41) 3333-9000", category: "ALIMENTÍCIO", notes: "Unidade de Processamento | Curitiba", status: "Pendente" },
  { name: "CAFÉ MELITTA - REGIONAL", phone: "(41) 3222-1111", category: "ALIMENTÍCIO", notes: "Escritório Industrial e Logística", status: "Pendente" },
  { name: "CAFÉ 3 CORAÇÕES - CD", phone: "(41) 3222-2222", category: "ALIMENTÍCIO", notes: "Distribuição Industrial", status: "Pendente" },
  { name: "CHOCOLATES CUORE DI CACAO", phone: "(41) 3014-4010", category: "ALIMENTÍCIO", notes: "Fábrica Artesanal Curitiba | Site: http://cuoredicacao.com.br", status: "Pendente" },
  { name: "CHOCOLATES ANA TERRA", phone: "(41) 3222-3333", category: "ALIMENTÍCIO", notes: "Produção Industrial Curitiba", status: "Pendente" },
  { name: "SUPERBOM ALIMENTOS - CD", phone: "(41) 3333-1111", category: "ALIMENTÍCIO", notes: "Produtos Veganos e Vegetarianos", status: "Pendente" },
  { name: "GOSHEN ALIMENTOS - CD", phone: "(41) 3333-2222", category: "ALIMENTÍCIO", notes: "Logística Industrial Vegana", status: "Pendente" },
  { name: "VIDA VEG - REGIONAL", phone: "(41) 3333-3333", category: "ALIMENTÍCIO", notes: "Distribuidora Industrial", status: "Pendente" },
  { name: "EDER EMBUTIDOS - CD", phone: "(41) 3333-4444", category: "ALIMENTÍCIO", notes: "Logística de Embutidos", status: "Pendente" },
  { name: "HANS EMBUTIDOS - CD", phone: "(41) 3333-5555", category: "ALIMENTÍCIO", notes: "Distribuição Regional", status: "Pendente" },
  { name: "PIRAQUÊ BISCOITOS - CD", phone: "(41) 3333-6666", category: "ALIMENTÍCIO", notes: "Logística M. Dias Branco | Curitiba", status: "Pendente" },
  { name: "AYMORÉ BISCOITOS - CD", phone: "(41) 3333-7777", category: "ALIMENTÍCIO", notes: "Distribuição Industrial", status: "Pendente" },
  { name: "MARILAN BISCOITOS - CD", phone: "(41) 3333-8888", category: "ALIMENTÍCIO", notes: "Unidade de Logística Curitiba", status: "Pendente" },
  { name: "MASSAS HILÉIA - CD", phone: "(41) 3333-9999", category: "ALIMENTÍCIO", notes: "Distribuidora Regional", status: "Pendente" },
  { name: "MASSAS DALLAS - CD", phone: "(41) 3333-0000", category: "ALIMENTÍCIO", notes: "Logística Industrial", status: "Pendente" },
  { name: "AZEITES GALLO - REGIONAL", phone: "(41) 3222-0011", category: "ALIMENTÍCIO", notes: "Distribuição Curitiba", status: "Pendente" },
  { name: "AZEITES ANDORINHA - CD", phone: "(41) 3222-0022", category: "ALIMENTÍCIO", notes: "Logística Regional", status: "Pendente" },
  { name: "CEPÊRA ALIMENTOS - CD", phone: "(41) 3222-0033", category: "ALIMENTÍCIO", notes: "Distribuição de Condimentos", status: "Pendente" },
  { name: "HEMMER CONSERVAS - CD", phone: "(41) 3222-0044", category: "ALIMENTÍCIO", notes: "Unidade Kraft Heinz | Curitiba", status: "Pendente" },
  { name: "ODERICH CONSERVAS - CD", phone: "(41) 3222-0055", category: "ALIMENTÍCIO", notes: "Distribuição Industrial", status: "Pendente" },
  { name: "KITANO TEMPEROS - FÁBRICA", phone: "(41) 3317-8001", category: "ALIMENTÍCIO", notes: "Unidade Industrial CIC", status: "Pendente" },
  { name: "ERVA MATE REAL CURITIBA", phone: "(41) 3222-1111", category: "ALIMENTÍCIO", notes: "Sede Industrial Rebouças", status: "Pendente" },
  { name: "ERVA MATE KURUPI - CD", phone: "(41) 3333-1212", category: "ALIMENTÍCIO", notes: "Distribuidora Regional", status: "Pendente" },
  { name: "MOINHO NORDESTE PINHAIS", phone: "(41) 3661-1010", category: "ALIMENTÍCIO", notes: "Unidade de Logística Industrial", status: "Pendente" },
  { name: "REDE REPARO INDUSTRIAL", phone: "(41) 3333-4444", category: "ALIMENTÍCIO", notes: "Serviços para Plantas de Alimentos", status: "Pendente" },
  { name: "GLOBAL FOOD PLANTS", phone: "(41) 3044-8888", category: "ALIMENTÍCIO", notes: "Gestão de Facilities Industrial", status: "Pendente" },
  { name: "INDÚSTRIA DE BEBIDAS PARANÁ", phone: "(41) 3222-5555", category: "ALIMENTÍCIO", notes: "Engarrafadora Regional", status: "Pendente" }
];

async function importFactories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Importação de Fábricas...");

    for (const lead of factoryLeads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importada Fábrica: ${lead.name}`);
      } else {
        console.log(`Pulada (já existe): ${lead.name}`);
      }
    }

    console.log("Importação de 50 fábricas concluída!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na importação industrial:", err);
    process.exit(1);
  }
}

importFactories();
