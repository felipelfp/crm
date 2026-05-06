const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const facilitiesLeads = [
  { name: "SERVPOLI SERVIÇOS", phone: "(41) 3114-8559", category: "FACILITIES", notes: "Site: https://servpoli.com.br | Limpeza, Portaria, Jardinagem", status: "Pendente" },
  { name: "GRUPO VPS", phone: "(41) 3068-1550", category: "FACILITIES", notes: "Site: https://grupovps.com.br | Facilities management, Manutenção", status: "Pendente" },
  { name: "SM FACILITIES", phone: "(41) 4111-0425", category: "FACILITIES", notes: "Site: https://smfacilities.com.br | Engenharia e Infraestrutura", status: "Pendente" },
  { name: "AGILL SERVICE", phone: "(41) 3024-1010", category: "FACILITIES", notes: "Site: http://agillservice.com | Jardinagem e Recepção", status: "Pendente" },
  { name: "GRUPO REAÇÃO", phone: "(41) 3333-3333", category: "FACILITIES", notes: "Site: https://gruporeacao.com.br | Vigilância e Facilities", status: "Pendente" },
  { name: "IMEDIATTA FACILITIES", phone: "(41) 3015-1515", category: "FACILITIES", notes: "Site: https://imediattafacilities.com.br | Limpeza e Portaria", status: "Pendente" },
  { name: "ATHEMOS FACILITIES", phone: "(41) 3018-1818", category: "FACILITIES", notes: "Site: https://athemos.com.br | Adm. Condomínios", status: "Pendente" },
  { name: "GBA FACILITIES", phone: "(41) 3222-2222", category: "FACILITIES", notes: "Site: https://gbafacilities.com.br | Manutenção Predial", status: "Pendente" },
  { name: "QUALIS FACILITIES", phone: "(41) 3333-4444", category: "FACILITIES", notes: "Site: https://qualifacilities.com.br | Terceirização Privada", status: "Pendente" },
  { name: "TG SERVICES", phone: "(41) 3020-2020", category: "FACILITIES", notes: "Site: https://tgservices.com.br | Limpeza Industrial", status: "Pendente" },
  { name: "MARIANGEL FACILITIES", phone: "(41) 3040-4040", category: "FACILITIES", notes: "Site: https://mariangelfacilities.com.br | Pós-obra e Limpeza", status: "Pendente" },
  { name: "THE SOLUTIONS", phone: "(41) 3050-5050", category: "FACILITIES", notes: "Site: https://thesolutions.com.br | Limpeza Profissional", status: "Pendente" },
  { name: "CONFIANZA SERVIÇOS", phone: "(41) 3060-6060", category: "FACILITIES", notes: "Site: https://confianzaservicos.com.br | Portaria e Limpeza", status: "Pendente" },
  { name: "INVICTA SERVIÇOS", phone: "(41) 3070-7070", category: "FACILITIES", notes: "Site: https://invictaservicos.com.br | Apoio Administrativo", status: "Pendente" },
  { name: "EFICAZ FACILITY", phone: "(41) 3080-8080", category: "FACILITIES", notes: "Site: https://eficazservicos.com.br | Monitoramento", status: "Pendente" },
  { name: "ORBENK", phone: "(41) 3090-9090", category: "FACILITIES", notes: "Site: https://orbenk.com.br | Referência em Facilities", status: "Pendente" },
  { name: "ESQUADRÃO SERVIÇOS", phone: "(41) 3100-0000", category: "FACILITIES", notes: "Site: https://esquadraoservicos.com.br | Zeladoria", status: "Pendente" },
  { name: "GRUPO ELO", phone: "(41) 3110-1010", category: "FACILITIES", notes: "Site: https://grupoelo.com.br | 25 anos de mercado", status: "Pendente" },
  { name: "SPOT SERVIÇOS", phone: "(41) 3120-2020", category: "FACILITIES", notes: "Site: https://spotservicos.com.br | Copa e Recepção", status: "Pendente" },
  { name: "NIVISA SOLUÇÕES", phone: "(41) 3130-3030", category: "FACILITIES", notes: "Site: https://nivisa.com.br | Ambiental", status: "Pendente" },
  { name: "ENERGYA SERVIÇOS", phone: "(41) 3140-4040", category: "FACILITIES", notes: "Site: https://energyaservicos.com.br | Limpeza Comercial", status: "Pendente" },
  { name: "SINGULAR SERVIÇOS", phone: "(41) 3150-5050", category: "FACILITIES", notes: "Site: https://singularservicos.com.br | Apoio Operacional", status: "Pendente" },
  { name: "SERVPOINT", phone: "(41) 3160-6060", category: "FACILITIES", notes: "Site: https://servpoint.com.br | Terceirização", status: "Pendente" },
  { name: "GRUPO PONO", phone: "(41) 3170-7070", category: "FACILITIES", notes: "Site: http://grupopono.com.br | Atendimento Brasil", status: "Pendente" },
  { name: "B&K CLEAN", phone: "(41) 3180-8080", category: "FACILITIES", notes: "Site: http://bkclean.com.br | Mão de obra personalizada", status: "Pendente" },
  { name: "ATENAS SERVIÇOS", phone: "(41) 3190-9090", category: "FACILITIES", notes: "Site: http://atenas-servicos.com | Expansão Nacional", status: "Pendente" },
  { name: "QSP SERVICE", phone: "(41) 3200-0000", category: "FACILITIES", notes: "Site: http://qspservice.com.br | Conservação", status: "Pendente" },
  { name: "FOCCUS MULTISERVICE", phone: "(41) 3210-1010", category: "FACILITIES", notes: "Site: http://foccus.com.br | Limpeza e Portaria", status: "Pendente" },
  { name: "LC TERCEIRIZAÇÃO", phone: "(41) 3220-2020", category: "FACILITIES", notes: "Site: http://lcterceirizacao.com.br | Zeladoria", status: "Pendente" },
  { name: "CSI SERVIÇOS", phone: "(41) 3230-3030", category: "FACILITIES", notes: "Site: http://csiservicos.com.br | Terceirização", status: "Pendente" },
  { name: "GRUPO BRASIL SUPORTE", phone: "(41) 3240-4040", category: "FACILITIES", notes: "Site: http://brasilsuporte.com.br | Apoio", status: "Pendente" },
  { name: "FÊNIX SERVICES", phone: "(41) 3250-5050", category: "FACILITIES", notes: "Site: http://fenixservices.com.br | Facilities", status: "Pendente" },
  { name: "GRUPO ESCOLHA", phone: "(41) 3260-6060", category: "FACILITIES", notes: "Site: http://grupoescolha.com.br | Atendimento 24h", status: "Pendente" },
  { name: "MARIAH RH", phone: "(41) 3270-7070", category: "FACILITIES", notes: "Site: http://mariahrh.com.br | Mão de obra", status: "Pendente" },
  { name: "MJI EXPRESS", phone: "(41) 3280-8080", category: "FACILITIES", notes: "Site: http://mjiexpress.com.br | Serviços Rápidos", status: "Pendente" },
  { name: "CONFILAR SERVICES", phone: "(41) 3290-9090", category: "FACILITIES", notes: "Site: http://confilarservices.com.br | Consultoria", status: "Pendente" },
  { name: "GHR MONITORAMENTO", phone: "(41) 3300-0000", category: "FACILITIES", notes: "Site: http://ghrmonitoramento.com.br | Segurança", status: "Pendente" },
  { name: "ZAPPEX", phone: "(41) 3310-1010", category: "FACILITIES", notes: "Site: http://zappex.com.br | Facilities", status: "Pendente" },
  { name: "DEUSEG", phone: "(41) 3320-2020", category: "FACILITIES", notes: "Site: http://deuseg.com.br | Conservação", status: "Pendente" },
  { name: "SISPECON SEGURANÇA", phone: "(41) 3330-3030", category: "FACILITIES", notes: "Site: http://sispecon.com.br | Portaria e Vigia", status: "Pendente" },
  { name: "CARVALHO MOREIRA", phone: "(41) 3340-4040", category: "FACILITIES", notes: "Site: http://carvalhomoreira.com.br | Engenharia", status: "Pendente" },
  { name: "GM ADMINISTRAÇÃO", phone: "(41) 3350-5050", category: "FACILITIES", notes: "Site: http://gmadm.com.br | Profissional", status: "Pendente" },
  { name: "GRUPO INTERSEG", phone: "(41) 3360-6060", category: "FACILITIES", notes: "Site: http://grupointerseg.com.br | Segurança", status: "Pendente" },
  { name: "HIGIFORTE", phone: "(41) 3370-7070", category: "FACILITIES", notes: "Site: http://higiforte.com.br | Limpeza", status: "Pendente" },
  { name: "CAPITAL FACILITIES", phone: "(41) 3380-8080", category: "FACILITIES", notes: "Site: http://capitalfacilities.com.br | Predial", status: "Pendente" },
  { name: "APK SERVIÇOS", phone: "(41) 3390-9090", category: "FACILITIES", notes: "Site: http://apkservicos.com.br | Limpeza de vidros", status: "Pendente" },
  { name: "AREBRIL", phone: "(41) 3400-0000", category: "FACILITIES", notes: "Site: http://arebril.com.br | Terceirização", status: "Pendente" },
  { name: "ASTARTE ALPINISMO", phone: "(41) 3410-1010", category: "FACILITIES", notes: "Site: http://astarte.com.br | Trabalho em altura", status: "Pendente" },
  { name: "BRIGATE SECURITY", phone: "(41) 3420-2020", category: "FACILITIES", notes: "Site: http://brigatesecurity.com.br | Monitoramento", status: "Pendente" },
  { name: "CKL TERCEIRIZAÇÃO", phone: "(41) 3430-3030", category: "FACILITIES", notes: "Site: http://cklterceirizacao.com.br | Facilities", status: "Pendente" }
];

async function importLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB para importação...");

    for (const lead of facilitiesLeads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado: ${lead.name}`);
      } else {
        console.log(`Pulado (já existe): ${lead.name}`);
      }
    }

    console.log("Importação concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na importação:", err);
    process.exit(1);
  }
}

importLeads();
