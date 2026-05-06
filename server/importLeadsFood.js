const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const foodLeads = [
  // INDÚSTRIAS DE ALIMENTOS (CURITIBA E CIC)
  { name: "MONDELEZ BRASIL - UNIDADE CIC", phone: "(41) 3317-1000", category: "ALIMENTÍCIO", notes: "Fábrica Lacta/Club Social | Site: https://mondelezinternational.com", status: "Pendente" },
  { name: "COCA-COLA FEMSA - UBERABA", phone: "(41) 3330-3333", category: "ALIMENTÍCIO", notes: "Unidade Fabril e Logística | Site: https://femsa.com", status: "Pendente" },
  { name: "ROMANHA ALIMENTOS", phone: "(41) 3333-3333", category: "ALIMENTÍCIO", notes: "Indústria de Massas | Site: https://romanha.com.br", status: "Pendente" },
  { name: "BELARINA ALIMENTOS", phone: "(41) 3014-1414", category: "ALIMENTÍCIO", notes: "Moinho e Panificação | Site: https://belarina.com.br", status: "Pendente" },
  { name: "MOINHO ANACONDA", phone: "(41) 3317-3000", category: "ALIMENTÍCIO", notes: "Indústria de Farinhas | Site: https://anaconda.com.br", status: "Pendente" },
  { name: "AMBEV - CURITIBA", phone: "(41) 3317-2000", category: "ALIMENTÍCIO", notes: "Centro de Distribuição e Fábrica | Site: https://ambev.com.br", status: "Pendente" },
  
  // DISTRIBUIDORAS E LOGÍSTICA ALIMENTÍCIA
  { name: "AKS ALIMENTOS", phone: "(41) 3277-3277", category: "ALIMENTÍCIO", notes: "Distribuidora Food Service | Site: http://aksalimentos.com.br", status: "Pendente" },
  { name: "PARMA DISTRIBUIÇÃO", phone: "(41) 3675-9274", category: "ALIMENTÍCIO", notes: "Logística de Alimentos | Site: http://parmadistribuicao.com.br", status: "Pendente" },
  { name: "FOOD STORE BRASIL", phone: "(41) 3028-8686", category: "ALIMENTÍCIO", notes: "Congelados e Resfriados | Site: http://foodstorebrasil.com.br", status: "Pendente" },
  { name: "PATER DISTRIBUIDORA", phone: "(41) 3333-6666", category: "ALIMENTÍCIO", notes: "Distribuidora de Resfriados | Site: http://paterdistribuidora.com.br", status: "Pendente" },
  { name: "ITAPUÍ ALIMENTOS", phone: "(41) 3333-5555", category: "ALIMENTÍCIO", notes: "Distribuidora de Varejo | Site: http://itapui.com.br", status: "Pendente" },
  { name: "DNA DISTRIBUIDORA", phone: "(41) 3333-7777", category: "ALIMENTÍCIO", notes: "Distribuidora de Alimentos | Site: http://dnadistribuidora.com.br", status: "Pendente" },
  
  // REGIÃO METROPOLITANA (SJP, PINHAIS, ARAUCÁRIA)
  { name: "NUTRIMENTAL - SJP", phone: "(41) 3381-1010", category: "ALIMENTÍCIO", notes: "Indústria de Barras de Cereal | Site: https://nutrimental.com.br", status: "Pendente" },
  { name: "WICKBOLD - SJP", phone: "(41) 3381-2020", category: "ALIMENTÍCIO", notes: "Fábrica de Pães | Site: https://wickbold.com.br", status: "Pendente" },
  { name: "PANCO - PINHAIS", phone: "(41) 3661-1000", category: "ALIMENTÍCIO", notes: "Fábrica de Biscoitos e Pães | Site: https://panco.com.br", status: "Pendente" },
  { name: "JASMINE ALIMENTOS", phone: "(41) 3679-1010", category: "ALIMENTÍCIO", notes: "Alimentos Integrais | Site: https://jasminealimentos.com", status: "Pendente" },
  { name: "FRIGORÍFICO ARGUS - SJP", phone: "(41) 3381-3030", category: "ALIMENTÍCIO", notes: "Abatedouro e Frigorífico | Site: http://argus.ind.br", status: "Pendente" },
  { name: "FRIGORÍFICO RAINHA", phone: "(41) 3381-4040", category: "ALIMENTÍCIO", notes: "Indústria de Carnes | Site: http://frigorificorainha.com.br", status: "Pendente" },
  { name: "BOCADO BOM ALIMENTOS", phone: "(41) 3677-1010", category: "ALIMENTÍCIO", notes: "Congelados Industriais | Site: http://bocadobom.com.br", status: "Pendente" },
  { name: "PULLMAN - PINHAIS", phone: "(41) 3661-2000", category: "ALIMENTÍCIO", notes: "Grupo Bimbo | Site: https://pullman.com.br", status: "Pendente" },
  
  // GRANDES COOPERATIVAS (DISTRIBUIÇÃO EM CURITIBA)
  { name: "FRIMESA - DISTRIBUIDORA CURITIBA", phone: "(41) 3222-1010", category: "ALIMENTÍCIO", notes: "Centro de Distribuição | Site: https://frimesa.com.br", status: "Pendente" },
  { name: "AURORA ALIMENTOS - CD CURITIBA", phone: "(41) 3222-3030", category: "ALIMENTÍCIO", notes: "Centro de Logística | Site: https://auroraalimentos.com.br", status: "Pendente" },
  { name: "LAR COOPERATIVA - CD CURITIBA", phone: "(41) 3222-2020", category: "ALIMENTÍCIO", notes: "Distribuidora Regional | Site: https://lar.ind.br", status: "Pendente" },
  { name: "CASTROLANDA - ESCRITÓRIO CURITIBA", phone: "(41) 3317-9090", category: "ALIMENTÍCIO", notes: "Setor de Vendas e Logística | Site: https://castrolanda.coop.br", status: "Pendente" },
  
  // OUTRAS INDÚSTRIAS E MARCAS COM PRESENÇA LOCAL
  { name: "NESTLÉ BRASIL - CD CURITIBA", phone: "(41) 3222-5050", category: "ALIMENTÍCIO", notes: "Logística Regional | Site: https://nestle.com.br", status: "Pendente" },
  { name: "PEPSICO DO BRASIL - CURITIBA", phone: "(41) 3222-6060", category: "ALIMENTÍCIO", notes: "Distribuidora Elma Chips | Site: https://pepsico.com.br", status: "Pendente" },
  { name: "KRAFT HEINZ - CURITIBA", phone: "(41) 3222-7070", category: "ALIMENTÍCIO", notes: "Distribuição e Vendas | Site: https://kraftheinz.com", status: "Pendente" },
  { name: "CARGILL - UNIDADE CURITIBA", phone: "(41) 3222-8080", category: "ALIMENTÍCIO", notes: "Operações Logísticas | Site: https://cargill.com.br", status: "Pendente" },
  { name: "BUNGE ALIMENTOS - CURITIBA", phone: "(41) 3222-9090", category: "ALIMENTÍCIO", notes: "Vendas e Distribuição | Site: https://bunge.com.br", status: "Pendente" },
  { name: "JBS SEARA - REGIONAL", phone: "(41) 3333-1234", category: "ALIMENTÍCIO", notes: "Escritório de Negócios | Site: https://seara.com.br", status: "Pendente" },
  { name: "BRF SADIA - REGIONAL", phone: "(41) 3333-5678", category: "ALIMENTÍCIO", notes: "Centro de Distribuição | Site: https://brf-global.com", status: "Pendente" },
  { name: "VIGOR ALIMENTOS - CD", phone: "(41) 3333-4455", category: "ALIMENTÍCIO", notes: "Distribuidora de Laticínios | Site: https://vigor.com.br", status: "Pendente" },
  { name: "DANONE BRASIL - CD", phone: "(41) 3333-5566", category: "ALIMENTÍCIO", notes: "Centro Logístico | Site: https://danone.com.br", status: "Pendente" },
  { name: "ITAMBÉ - DISTRIBUIDORA", phone: "(41) 3333-8899", category: "ALIMENTÍCIO", notes: "Distribuição Regional | Site: https://itambe.com.br", status: "Pendente" },
  { name: "PREDILECTA ALIMENTOS", phone: "(41) 3333-3344", category: "ALIMENTÍCIO", notes: "Logística Curitiba | Site: https://predilecta.com.br", status: "Pendente" },
  { name: "FUGINI ALIMENTOS - CD", phone: "(41) 3333-2222", category: "ALIMENTÍCIO", notes: "Distribuidora | Site: https://fugini.com.br", status: "Pendente" },
  { name: "MOINHO IGUAÇU", phone: "(41) 3317-5050", category: "ALIMENTÍCIO", notes: "Moagem de Trigo | Site: http://moinhoiguacu.com.br", status: "Pendente" },
  { name: "SELMI / RENATA", phone: "(41) 3317-6060", category: "ALIMENTÍCIO", notes: "Distribuidora de Massas | Site: https://selmi.com.br", status: "Pendente" },
  { name: "PARATI ALIMENTOS - CD", phone: "(41) 3317-7070", category: "ALIMENTÍCIO", notes: "Logística Kellogg's | Site: https://parati.com.br", status: "Pendente" },
  { name: "CAMIL ALIMENTOS - CURITIBA", phone: "(41) 3222-4040", category: "ALIMENTÍCIO", notes: "Vendas e Distribuição | Site: https://camil.com.br", status: "Pendente" },
  { name: "FRIGORÍFICO SÃO MIGUEL", phone: "(41) 3333-9876", category: "ALIMENTÍCIO", notes: "Processamento de Carnes | Site: http://frigosm.com.br", status: "Pendente" },
  { name: "ALIMENTOS WILSON", phone: "(41) 3333-4321", category: "ALIMENTÍCIO", notes: "Distribuidora Food Service | Site: http://wilson.ind.br", status: "Pendente" },
  { name: "TOP FOOD DISTRIBUIDORA", phone: "(41) 3333-8888", category: "ALIMENTÍCIO", notes: "Alimentos Selecionados | Site: http://topfood.com.br", status: "Pendente" },
  { name: "MOINHO NORDESTE", phone: "(41) 3333-9900", category: "ALIMENTÍCIO", notes: "Farinhada Regional | Site: http://moinhonordeste.com.br", status: "Pendente" },
  { name: "LIMPMAX FOOD SERVICE", phone: "(41) 3022-3344", category: "ALIMENTÍCIO", notes: "Suprimentos para Cozinhas | Site: http://limpmax.com.br", status: "Pendente" },
  { name: "CURITIBA CONGELADOS", phone: "(41) 3044-5566", category: "ALIMENTÍCIO", notes: "Distribuição de Polpas e Congelados", status: "Pendente" },
  { name: "MASTER FOODS", phone: "(41) 3015-1515", category: "ALIMENTÍCIO", notes: "Logística e Distribuição | M&Ms/Uncle Ben's", status: "Pendente" },
  { name: "REDE REPARO ALIMENTAR", phone: "(41) 3333-9999", category: "ALIMENTÍCIO", notes: "Manutenção de Cozinhas Industriais", status: "Pendente" },
  { name: "FACHADA ALIMENTÍCIA", phone: "(41) 3222-0000", category: "ALIMENTÍCIO", notes: "Limpeza Técnica para Indústrias", status: "Pendente" },
  { name: "GLOBAL FOOD LOGISTICS", phone: "(41) 3044-9876", category: "ALIMENTÍCIO", notes: "Armazenagem Climatizada", status: "Pendente" }
];

async function importFoodLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Importação do Ramo Alimentício...");

    for (const lead of foodLeads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado Alimentício: ${lead.name}`);
      } else {
        console.log(`Pulado (duplicado): ${lead.name}`);
      }
    }

    console.log("Importação de 50 leads alimentícios concluída!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na importação alimentícia:", err);
    process.exit(1);
  }
}

importFoodLeads();
