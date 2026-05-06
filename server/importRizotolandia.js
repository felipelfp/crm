const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const specialLeads = [
  { name: "RIZOTOLÂNDIA REFEIÇÕES", phone: "(41) 3381-8000", category: "ALIMENTÍCIO", notes: "Líder em Refeições Coletivas | Sede Araucária | Site: https://rizotolandia.com.br", status: "Pendente" },
  { name: "RIZOTOLÂNDIA HOSPITALAR", phone: "(41) 3381-8080", category: "ALIMENTÍCIO", notes: "Divisão de Serviços Hospitalares do Grupo Rizotolândia", status: "Pendente" },
  { name: "ERAI REFEIÇÕES", phone: "(41) 3375-3000", category: "ALIMENTÍCIO", notes: "Concorrente Direto | Refeições Coletivas | Curitiba", status: "Pendente" },
  { name: "NUTRIVAL REFEIÇÕES", phone: "(41) 3024-4000", category: "ALIMENTÍCIO", notes: "Serviços de Alimentação Corporativa | Curitiba", status: "Pendente" },
  { name: "EXAL REFEIÇÕES", phone: "(41) 3014-9000", category: "ALIMENTÍCIO", notes: "Gestão de Restaurantes Corporativos | Curitiba", status: "Pendente" }
];

async function importSpecial() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Importação Especial...");

    for (const lead of specialLeads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado: ${lead.name}`);
      } else {
        console.log(`Pulado: ${lead.name}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

importSpecial();
