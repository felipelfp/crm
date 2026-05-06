const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const rmcCities = [
  'CURITIBA', 'SÃO JOSÉ DOS PINHAIS', 'SJP', 'PINHAIS', 'ARAUCÁRIA', 
  'COLOMBO', 'FAZENDA RIO GRANDE', 'FRG', 'CAMPO LARGO', 'PIRAQUARA', 
  'CAMPINA GRANDE DO SUL', 'QUATRO BARRAS', 'ALMIRANTE TAMANDARÉ'
];

async function cleanupRegional() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Iniciando Limpeza Regional (Foco 100% Curitiba e RMC)...");

    const leads = await Lead.find({});
    let deletedCount = 0;
    let updatedCount = 0;

    for (const lead of leads) {
      const name = lead.name.toUpperCase();
      const notes = (lead.notes || "").toUpperCase();
      const phone = (lead.phone || "");

      // 1. Verificar se o telefone é (41). Se for outro DDD (ex: 11, 47) e não citar Curitiba, é suspeito.
      const isLocalPhone = phone.includes('(41)') || phone.startsWith('41');
      
      // 2. Verificar se o nome ou notas citam alguma cidade da RMC
      const mentionsRMC = rmcCities.some(city => name.includes(city) || notes.includes(city));

      // 3. Se for uma multinacional sem menção local e sem telefone 41, removemos
      const isGiant = ["SODEXO", "SAPORE", "NESTLÉ", "AMBEV", "COCA-COLA", "CARGILL", "BUNGE"].some(g => name.includes(g));
      
      if (!isLocalPhone && !mentionsRMC && !isGiant) {
        await Lead.deleteOne({ _id: lead._id });
        console.log(`Removido (Fora da Região): ${lead.name}`);
        deletedCount++;
        continue;
      }

      // 4. Se for local mas o nome estiver genérico, adicionamos "CURITIBA" no nome para clareza
      if (isGiant && !name.includes("CURITIBA") && !name.includes("SJP") && !name.includes("PINHAIS")) {
        lead.name = `${lead.name} - UNIDADE CURITIBA/RMC`;
        await lead.save();
        updatedCount++;
      }
    }

    console.log(`Limpeza concluída!`);
    console.log(`Leads Removidos: ${deletedCount}`);
    console.log(`Leads Ajustados para Local: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanupRegional();
