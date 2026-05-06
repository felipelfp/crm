const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Lead = require('./models/Lead');

const importData = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB!');

    // Ler o arquivo leadsData.js
    const dataPath = path.join(__dirname, '../React/src/leadsData.js');
    let rawData = fs.readFileSync(dataPath, 'utf-8');
    
    // Extrair o array JSON do arquivo JS
    rawData = rawData.replace('export const leadsData = ', '').replace(/;$/, '');
    
    // Usar eval seguro para converter o array JS em objeto Node (já que as chaves não estão todas entre aspas duplas perfeitamente no formato JSON em alguns arquivos)
    let leadsArray = [];
    try {
        leadsArray = eval(rawData);
    } catch (e) {
        console.error("Erro ao fazer parse do array de leads:", e);
        process.exit(1);
    }

    console.log(`Encontrados ${leadsArray.length} leads no arquivo local.`);

    // Pegar os nomes que já existem no banco para evitar duplicidade
    const existingLeads = await Lead.find({}, 'name');
    const existingNames = new Set(existingLeads.map(l => (l.name || '').toUpperCase().trim()));

    const leadsToInsert = [];

    leadsArray.forEach(l => {
      if (!l || !l.name) return;
      const name = l.name.toUpperCase().trim();
      
      if (!existingNames.has(name) && name.length > 2) {
        existingNames.add(name); // Evitar duplicação dentro do próprio arquivo
        
        let cat = (l.category || 'SERVIÇOS').toUpperCase().trim();
        if (cat === 'ALIMENTÍCIOS' || cat === 'ALIMENTICIOS') cat = 'ALIMENTÍCIO';
        if (cat === 'CONSTRUÇÃO') cat = 'CONSTRUTORAS';
        if (!['CONSTRUTORAS', 'ESCOLAS', 'FACULDADES', 'SERVIÇOS', 'FACILITIES', 'ALIMENTÍCIO'].includes(cat)) {
          cat = 'SERVIÇOS'; 
        }

        leadsToInsert.push({
          name: l.name,
          phone: l.phone || '',
          resp: l.resp || '',
          status: l.status || 'Pendente',
          week: l.week || 'Semana 1',
          notes: l.address || l.notes || '',
          category: cat,
          address: l.address || '',
          regional: l.regional || '',
          history: l.history || [],
          consultant: ''
        });
      }
    });

    if (leadsToInsert.length > 0) {
      console.log(`Injetando ${leadsToInsert.length} novos leads no MongoDB...`);
      await Lead.insertMany(leadsToInsert);
      console.log('✅ Todos os leads foram importados com sucesso!');
    } else {
      console.log('Todos os leads já estão no banco de dados. Nenhuma inserção necessária.');
    }

    mongoose.disconnect();
    console.log('Processo finalizado.');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    mongoose.disconnect();
  }
};

importData();
