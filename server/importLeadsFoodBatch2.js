const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const foodBatch2 = [
  // FRIGORÍFICOS E DISTRIBUIDORAS DE CARNES
  { name: "FRIGORÍFICO BORDIN", phone: "(41) 3333-1122", category: "ALIMENTÍCIO", notes: "Distribuidora de Carnes | Site: http://frigorificobordin.com.br", status: "Pendente" },
  { name: "FRIGORÍFICO GAVAZZONI", phone: "(41) 3381-5050", category: "ALIMENTÍCIO", notes: "Unidade SJP | Site: http://gavazzoni.com.br", status: "Pendente" },
  { name: "FRIGORÍFICO REGIONAL - FRG", phone: "(41) 3627-1010", category: "ALIMENTÍCIO", notes: "Fazenda Rio Grande | Processamento de Carnes", status: "Pendente" },
  { name: "PLENA ALIMENTOS - CD CURITIBA", phone: "(41) 3222-9900", category: "ALIMENTÍCIO", notes: "Distribuição Nacional | Site: http://plenaalimentos.com.br", status: "Pendente" },
  { name: "VPJ ALIMENTOS - REGIONAL", phone: "(41) 3014-1415", category: "ALIMENTÍCIO", notes: "Cortes Especiais | Site: http://vpjalimentos.com.br", status: "Pendente" },
  
  // DISTRIBUIDORAS DE BEBIDAS
  { name: "DISTRIBUIDORA DE BEBIDAS JOINVILLE", phone: "(41) 3277-1010", category: "ALIMENTÍCIO", notes: "Unidade Curitiba | Ambev Partner", status: "Pendente" },
  { name: "DISTRIBUIDORA DE BEBIDAS FONTANA", phone: "(41) 3277-2020", category: "ALIMENTÍCIO", notes: "Logística de Bebidas | Site: http://bebidasfontana.com.br", status: "Pendente" },
  { name: "REDPRESS DISTRIBUIDORA", phone: "(41) 3333-4455", category: "ALIMENTÍCIO", notes: "Distribuidora Red Bull Regional", status: "Pendente" },
  
  // SORVETES E SOBREMESAS (INDÚSTRIAS)
  { name: "SORVETES BAPKA", phone: "(41) 3267-3131", category: "ALIMENTÍCIO", notes: "Fábrica e Distribuição | Site: http://bapka.com.br", status: "Pendente" },
  { name: "SORVETES FORMOSO", phone: "(41) 3333-8877", category: "ALIMENTÍCIO", notes: "Indústria de Sorvetes Curitiba", status: "Pendente" },
  { name: "PAVILOCHE DISTRIBUIDORA", phone: "(41) 3044-1122", category: "ALIMENTÍCIO", notes: "Logística Curitiba | Site: http://paviloche.com.br", status: "Pendente" },
  { name: "SORVETES JUNDIÁ - CD", phone: "(41) 3333-9988", category: "ALIMENTÍCIO", notes: "Distribuidora Regional", status: "Pendente" },
  
  // GRANDES PANIFICADORAS INDUSTRIAIS (COM FROTA E LOGÍSTICA)
  { name: "SAINT GERMAIN - PANIFICAÇÃO", phone: "(41) 3207-6868", category: "ALIMENTÍCIO", notes: "Produção Industrial de Pães e Confeitaria", status: "Pendente" },
  { name: "JAUJU PANIFICADORA", phone: "(41) 3333-5566", category: "ALIMENTÍCIO", notes: "Grandes Operações de Panificação", status: "Pendente" },
  { name: "PANIFICADORA AQUARIUS", phone: "(41) 3352-1212", category: "ALIMENTÍCIO", notes: "Operação 24h e Industrial", status: "Pendente" },
  { name: "REQUINTE PANIFICAÇÃO", phone: "(41) 3335-3109", category: "ALIMENTÍCIO", notes: "Fornecimento Corporativo", status: "Pendente" },
  { name: "FAMÍLIA FARINHA", phone: "(41) 3362-3050", category: "ALIMENTÍCIO", notes: "Produção em Escala | Site: http://familiafarinha.com.br", status: "Pendente" },
  
  // LOGÍSTICA DE SUPERMERCADOS (CENTROS DE DISTRIBUIÇÃO)
  { name: "CONDOR SUPERMERCADOS - CD", phone: "(41) 3212-2000", category: "ALIMENTÍCIO", notes: "Centro de Distribuição Logística | Site: http://condor.com.br", status: "Pendente" },
  { name: "MUFFATO - CD CURITIBA", phone: "(41) 3222-1010", category: "ALIMENTÍCIO", notes: "Logística e Distribuição Alimentar", status: "Pendente" },
  { name: "FESTVAL - CD LOGÍSTICA", phone: "(41) 3330-3330", category: "ALIMENTÍCIO", notes: "Central de Distribuição Curitiba", status: "Pendente" },
  { name: "ANGELONI - CD CURITIBA", phone: "(41) 3333-2222", category: "ALIMENTÍCIO", notes: "Logística Regional", status: "Pendente" },
  
  // DERIVADOS E ESPECIALIDADES
  { name: "DISTRIBUIDORA DE OVOS SÃO PAULO", phone: "(41) 3333-7777", category: "ALIMENTÍCIO", notes: "Distribuição de Ovos Curitiba", status: "Pendente" },
  { name: "BENASSI HORTIFRUTI - CD", phone: "(41) 3333-8888", category: "ALIMENTÍCIO", notes: "Distribuição de FLV Curitiba", status: "Pendente" },
  { name: "DIRETO DO CAMPO - CD", phone: "(41) 3333-9999", category: "ALIMENTÍCIO", notes: "Logística de Frutas e Verduras", status: "Pendente" },
  { name: "MOINHO DE TRIGO SÃO JORGE", phone: "(41) 3317-0011", category: "ALIMENTÍCIO", notes: "Produção de Farinhas", status: "Pendente" },
  { name: "PIPOCAS BOKU'S - PINHAIS", phone: "(41) 3667-1234", category: "ALIMENTÍCIO", notes: "Indústria de Salgadinhos", status: "Pendente" },
  { name: "FRESCATTO PESCADOS - CD", phone: "(41) 3333-5678", category: "ALIMENTÍCIO", notes: "Distribuidora de Peixes", status: "Pendente" },
  { name: "NETUNO PESCADOS - CD", phone: "(41) 3333-1234", category: "ALIMENTÍCIO", notes: "Logística de Pescados", status: "Pendente" },
  { name: "VITALMAR PESCADOS", phone: "(41) 3333-9876", category: "ALIMENTÍCIO", notes: "Distribuição Regional", status: "Pendente" },
  
  // LATICÍNIOS E DERIVADOS (DISTRIBUIDORAS)
  { name: "TIROLEZ - CD CURITIBA", phone: "(41) 3022-2233", category: "ALIMENTÍCIO", notes: "Distribuição de Queijos", status: "Pendente" },
  { name: "SCALA LATICÍNIOS - CD", phone: "(41) 3333-1111", category: "ALIMENTÍCIO", notes: "Logística Regional", status: "Pendente" },
  { name: "QUATÁ ALIMENTOS - CD", phone: "(41) 3333-2222", category: "ALIMENTÍCIO", notes: "Distribuidora de Laticínios", status: "Pendente" },
  { name: "POLENGHI ALIMENTOS - CD", phone: "(41) 3333-3344", category: "ALIMENTÍCIO", notes: "Logística Curitiba", status: "Pendente" },
  { name: "PRESIDENT ALIMENTOS - CD", phone: "(41) 3333-4455", category: "ALIMENTÍCIO", notes: "Distribuição Nacional", status: "Pendente" },
  
  // DOCES E GULOSEIMAS (CENTROS DE DISTRIBUIÇÃO)
  { name: "ARCOR DO BRASIL - CD", phone: "(41) 3333-5566", category: "ALIMENTÍCIO", notes: "Distribuidora Regional Curitiba", status: "Pendente" },
  { name: "PECCIN ALIMENTOS - CD", phone: "(41) 3333-6677", category: "ALIMENTÍCIO", notes: "Logística e Distribuição", status: "Pendente" },
  { name: "FLORESTAL ALIMENTOS - CD", phone: "(41) 3333-7788", category: "ALIMENTÍCIO", notes: "Distribuidora Regional", status: "Pendente" },
  { name: "LUGANO CHOCOLATES - CD", phone: "(41) 3333-8899", category: "ALIMENTÍCIO", notes: "Logística de Chocolates", status: "Pendente" },
  
  // OUTRAS INDÚSTRIAS CONFIRMADAS
  { name: "MOINHO NORDESTE CURITIBA", phone: "(41) 3317-1010", category: "ALIMENTÍCIO", notes: "Vendas e Logística de Farinhas", status: "Pendente" },
  { name: "ALIMENTOS WILSON - CD", phone: "(41) 3333-4321", category: "ALIMENTÍCIO", notes: "Food Service e Distribuição", status: "Pendente" },
  { name: "ALFA ALIMENTOS", phone: "(41) 3277-3333", category: "ALIMENTÍCIO", notes: "Distribuidora de Embalagens e Alimentos", status: "Pendente" },
  { name: "PRIME FOODS", phone: "(41) 3044-2211", category: "ALIMENTÍCIO", notes: "Distribuidora de Carnes Nobres", status: "Pendente" },
  { name: "QUALY ALIMENTOS", phone: "(41) 3333-0011", category: "ALIMENTÍCIO", notes: "Logística de Frios", status: "Pendente" },
  { name: "D'ITALIA MASSAS", phone: "(41) 3222-4455", category: "ALIMENTÍCIO", notes: "Indústria de Massas Curitiba", status: "Pendente" },
  { name: "PANIFICADORA KENNEDY", phone: "(41) 3212-3200", category: "ALIMENTÍCIO", notes: "Operação Industrial de Panificação", status: "Pendente" },
  { name: "PANIFICADORA PIEGEL", phone: "(41) 3252-5553", category: "ALIMENTÍCIO", notes: "Produção e Logística Própria", status: "Pendente" },
  { name: "BRIOCHE PANIFICAÇÃO", phone: "(41) 3335-5122", category: "ALIMENTÍCIO", notes: "Unidade Ahoginho/Batel", status: "Pendente" },
  { name: "PÃO DE MEL PANIFICADORA", phone: "(41) 3342-6112", category: "ALIMENTÍCIO", notes: "Grande Produção Água Verde", status: "Pendente" },
  { name: "MOINHO DE TRIGO SUDOESTE - CD", phone: "(41) 3317-2233", category: "ALIMENTÍCIO", notes: "Logística de Farinhas Curitiba", status: "Pendente" },
  { name: "REDE REPARO FOOD", phone: "(41) 3333-1212", category: "ALIMENTÍCIO", notes: "Facilities para Cozinhas Industriais", status: "Pendente" }
];

async function importFoodBatch2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Lote 2 Alimentício...");

    for (const lead of foodBatch2) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado: ${lead.name}`);
      } else {
        console.log(`Pulado (duplicado): ${lead.name}`);
      }
    }

    console.log("Lote 2 concluído! +50 leads alimentícios adicionados.");
    process.exit(0);
  } catch (err) {
    console.error("Erro no Lote 2 Alimentício:", err);
    process.exit(1);
  }
}

importFoodBatch2();
