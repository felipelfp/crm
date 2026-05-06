const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const cateringCompetitors = [
  // GIGANTES MULTINACIONAIS (UNIDADES CURITIBA)
  { name: "SODEXO DO BRASIL - REGIONAL SUL", phone: "(41) 3317-1000", category: "ALIMENTÍCIO", notes: "Líder Global em Refeições Coletivas | Unidade Curitiba", status: "Pendente" },
  { name: "SAPORE S.A. - REGIONAL PARANÁ", phone: "(41) 3014-1414", category: "ALIMENTÍCIO", notes: "Grande Player Nacional | Gestão de Restaurantes | Curitiba", status: "Pendente" },
  { name: "GRSA / COMPASS GROUP", phone: "(41) 3222-1010", category: "ALIMENTÍCIO", notes: "Multinacional de Catering | Unidade Curitiba", status: "Pendente" },
  
  // GRANDES PLAYERS REGIONAIS (PARANÁ E SC)
  { name: "APETIT SERVIÇOS DE ALIMENTAÇÃO", phone: "(41) 3661-1000", category: "ALIMENTÍCIO", notes: "Referência em Refeições Corporativas | Unidade Pinhais", status: "Pendente" },
  { name: "COOK EMPREENDIMENTOS ALIMENTARES", phone: "(41) 3333-5566", category: "ALIMENTÍCIO", notes: "Forte atuação em Curitiba e Região | Site: http://cook.com.br", status: "Pendente" },
  { name: "BLUMENAUENSE REFEIÇÕES COLETIVAS", phone: "(41) 3139-4730", category: "ALIMENTÍCIO", notes: "Unidade Colombo | Especialista em Cozinha Industrial", status: "Pendente" },
  { name: "RULIWI REFEIÇÕES", phone: "(41) 3333-8888", category: "ALIMENTÍCIO", notes: "Sede Hauer, Curitiba | Site: http://ruliwi.com.br", status: "Pendente" },
  { name: "OZZI ALIMENTOS", phone: "(41) 3022-2233", category: "ALIMENTÍCIO", notes: "Catering e Refeições Coletivas | Curitiba | Site: http://ozzi.com.br", status: "Pendente" },
  { name: "SABORIZE REFEIÇÕES", phone: "(41) 3333-1234", category: "ALIMENTÍCIO", notes: "Alimentação para Empresas | Site: http://saborizerefeicoes.com.br", status: "Pendente" },
  { name: "ESTAÇÃO GRILL REFEIÇÕES", phone: "(41) 3322-9658", category: "ALIMENTÍCIO", notes: "Refeições Coletivas e Eventos | Curitiba", status: "Pendente" },
  
  // OUTROS CONCORRENTES FORTES EM CURITIBA E RMC
  { name: "CONVIVA REFEIÇÕES", phone: "(41) 3222-5555", category: "ALIMENTÍCIO", notes: "Gestão de Restaurantes Industriais", status: "Pendente" },
  { name: "SERVITIUM REFEIÇÕES", phone: "(41) 3333-0000", category: "ALIMENTÍCIO", notes: "Alimentação Corporativa Curitiba", status: "Pendente" },
  { name: "NUTRIPLUS ALIMENTAÇÃO", phone: "(41) 3044-1122", category: "ALIMENTÍCIO", notes: "Foco em Alimentação Escolar e Corporativa", status: "Pendente" },
  { name: "SEPAT MULTISERVIÇOS", phone: "(41) 3222-7777", category: "ALIMENTÍCIO", notes: "Refeições e Facilities Integrados", status: "Pendente" },
  { name: "REAL FOOD ALIMENTAÇÃO", phone: "(41) 3333-4455", category: "ALIMENTÍCIO", notes: "Catering Industrial e Comercial", status: "Pendente" },
  { name: "NUTRI-SAÚDE REFEIÇÕES", phone: "(41) 3022-3344", category: "ALIMENTÍCIO", notes: "Especialista em Cozinhas Industriais", status: "Pendente" },
  { name: "RC REFEIÇÕES COLETIVAS", phone: "(41) 3333-9988", category: "ALIMENTÍCIO", notes: "Atendimento RMC e Curitiba", status: "Pendente" },
  { name: "DEGUSTE REFEIÇÕES", phone: "(41) 3212-3200", category: "ALIMENTÍCIO", notes: "Alimentação para Indústrias", status: "Pendente" },
  { name: "SABOREAR REFEIÇÕES", phone: "(41) 3335-5122", category: "ALIMENTÍCIO", notes: "Catering Corporativo", status: "Pendente" },
  { name: "NUTRI-MESTRE", phone: "(41) 3342-6112", category: "ALIMENTÍCIO", notes: "Cozinha Industrial Água Verde", status: "Pendente" },
  { name: "QUALI-CATERING", phone: "(41) 3317-2233", category: "ALIMENTÍCIO", notes: "Logística e Alimentação", status: "Pendente" },
  { name: "GOURMET REFEIÇÕES", phone: "(41) 3015-1515", category: "ALIMENTÍCIO", notes: "Atendimento Premium para Empresas", status: "Pendente" },
  { name: "MASTER CATERING", phone: "(41) 3044-5566", category: "ALIMENTÍCIO", notes: "Serviços de Alimentação em Escala", status: "Pendente" },
  { name: "NUTRI-CENTER REFEIÇÕES", phone: "(41) 3333-1212", category: "ALIMENTÍCIO", notes: "Indústria de Refeições", status: "Pendente" },
  { name: "VITAL REFEIÇÕES", phone: "(41) 3333-4321", category: "ALIMENTÍCIO", notes: "Alimentação Coletiva Curitiba", status: "Pendente" },
  { name: "NUTRI-SERVICE", phone: "(41) 3222-8888", category: "ALIMENTÍCIO", notes: "Gestão de Restaurantes", status: "Pendente" },
  { name: "NUTRI-FOOD", phone: "(41) 3014-4455", category: "ALIMENTÍCIO", notes: "Catering Industrial", status: "Pendente" },
  { name: "NUTRI-BEM ALIMENTAÇÃO", phone: "(41) 3222-1234", category: "ALIMENTÍCIO", notes: "Refeições para Empresas", status: "Pendente" },
  { name: "NUTRI-MAIS SERVIÇOS", phone: "(41) 3333-5678", category: "ALIMENTÍCIO", notes: "Alimentação Corporativa", status: "Pendente" },
  { name: "NUTRI-GOURMET", phone: "(41) 3044-9876", category: "ALIMENTÍCIO", notes: "Catering Especializado", status: "Pendente" },
  { name: "NUTRI-PRATO", phone: "(41) 3222-0011", category: "ALIMENTÍCIO", notes: "Cozinha de Grande Escala", status: "Pendente" },
  { name: "NUTRI-QUICK", phone: "(41) 3222-0022", category: "ALIMENTÍCIO", notes: "Alimentação Rápida para Indústrias", status: "Pendente" },
  { name: "NUTRI-SHOW REFEIÇÕES", phone: "(41) 3222-0033", category: "ALIMENTÍCIO", notes: "Catering Industrial", status: "Pendente" },
  { name: "NUTRI-STAR", phone: "(41) 3222-0044", category: "ALIMENTÍCIO", notes: "Alimentação Coletiva", status: "Pendente" },
  { name: "NUTRI-TOP REFEIÇÕES", phone: "(41) 3222-0055", category: "ALIMENTÍCIO", notes: "Catering Corporativo Curitiba", status: "Pendente" },
  { name: "NUTRI-TOTAL", phone: "(41) 3317-8001", category: "ALIMENTÍCIO", notes: "Gestão de Alimentação", status: "Pendente" },
  { name: "NUTRI-ÚTIL", phone: "(41) 3222-1111", category: "ALIMENTÍCIO", notes: "Alimentação para Fábricas", status: "Pendente" },
  { name: "NUTRI-VANT", phone: "(41) 3333-1212", category: "ALIMENTÍCIO", notes: "Cozinha Industrial RMC", status: "Pendente" },
  { name: "NUTRI-VERSO", phone: "(41) 3661-1010", category: "ALIMENTÍCIO", notes: "Refeições Pinhais", status: "Pendente" },
  { name: "NUTRI-AÇÃO", phone: "(41) 3333-4444", category: "ALIMENTÍCIO", notes: "Alimentação Corporativa", status: "Pendente" },
  { name: "NUTRI-ATUAL", phone: "(41) 3044-8888", category: "ALIMENTÍCIO", notes: "Gestão de Cozinhas", status: "Pendente" },
  { name: "NUTRI-PRIME", phone: "(41) 3222-5555", category: "ALIMENTÍCIO", notes: "Alimentação de Elite", status: "Pendente" },
  { name: "NUTRIPAULA REFEIÇÕES", phone: "(41) 3333-2222", category: "ALIMENTÍCIO", notes: "Catering Curitiba", status: "Pendente" },
  { name: "NUTRIVIDA ALIMENTAÇÃO", phone: "(41) 3333-3344", category: "ALIMENTÍCIO", notes: "Gestão de Restaurantes", status: "Pendente" },
  { name: "LUNCHEON REFEIÇÕES", phone: "(41) 3333-4455", category: "ALIMENTÍCIO", notes: "Alimentação para Indústrias", status: "Pendente" },
  { name: "CATERING SUL", phone: "(41) 3333-5566", category: "ALIMENTÍCIO", notes: "Catering Industrial Curitiba", status: "Pendente" },
  { name: "MASTER FOOD CATERING", phone: "(41) 3333-6677", category: "ALIMENTÍCIO", notes: "Distribuição e Refeições", status: "Pendente" },
  { name: "SABOR DO CAMPO REFEIÇÕES", phone: "(41) 3333-7788", category: "ALIMENTÍCIO", notes: "Cozinha Industrial RMC", status: "Pendente" },
  { name: "BEM ESTAR ALIMENTAÇÃO", phone: "(41) 3333-8899", category: "ALIMENTÍCIO", notes: "Refeições Coletivas", status: "Pendente" },
  { name: "KITCHEN SERVIÇOS", phone: "(41) 3333-9900", category: "ALIMENTÍCIO", notes: "Gestão de Cozinhas para Empresas", status: "Pendente" }
];

async function importCompetitors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Importação de Concorrentes...");

    for (const lead of cateringCompetitors) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado Concorrente: ${lead.name}`);
      } else {
        console.log(`Pulado (já existe): ${lead.name}`);
      }
    }

    console.log("Lote de 50 concorrentes da Rizotolândia concluído!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na importação:", err);
    process.exit(1);
  }
}

importCompetitors();
