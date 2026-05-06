const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const batch2Leads = [
  // SEGURANÇA E PORTARIA
  { name: "INTERSEPT SEGURANÇA", phone: "(41) 3266-9581", category: "FACILITIES", notes: "Site: https://intersept.com.br | Líder em Segurança e Monitoramento", status: "Pendente" },
  { name: "OSTENSEG", phone: "(41) 3332-4449", category: "FACILITIES", notes: "Site: https://ostenseg.com.br | Segurança Patrimonial e Portaria Remota", status: "Pendente" },
  { name: "ALCATRAZ SEGURANÇA", phone: "(41) 3275-4888", category: "FACILITIES", notes: "Site: https://grupoalcatraz.com.br | Vigilância e CFTV", status: "Pendente" },
  { name: "GRUPO HAGANÁ", phone: "(41) 3040-4040", category: "FACILITIES", notes: "Site: https://hagana.com.br | Referência Nacional em Vigilância", status: "Pendente" },
  { name: "GRUPO INTERSEG", phone: "(41) 3122-2034", category: "FACILITIES", notes: "Site: https://grupointerseg.com | Segurança e Portaria", status: "Pendente" },
  
  // MANUTENÇÃO PREDIAL E ENGENHARIA
  { name: "BARRETO E PASSAURA", phone: "(41) 3222-3030", category: "FACILITIES", notes: "Site: https://barretopassaura.com.br | Manutenção Predial e Reformas", status: "Pendente" },
  { name: "JR MANUTENÇÃO PREDIAL", phone: "(41) 3333-5555", category: "FACILITIES", notes: "Site: http://jrmanutencaopredial.com.br | Lavagem e Pintura", status: "Pendente" },
  { name: "ABPLAN ENGENHARIA", phone: "(41) 99634-4092", category: "FACILITIES", notes: "Site: http://abplanengenharia.com.br | Manutenção Elétrica e Industrial", status: "Pendente" },
  { name: "GENOVA ENGENHARIA", phone: "(41) 3015-1010", category: "FACILITIES", notes: "Site: https://genovaengenharia.com.br | Obras Corporativas", status: "Pendente" },
  { name: "ST ELETRICIDADE", phone: "(41) 3022-2222", category: "FACILITIES", notes: "Site: http://steletricidade.com.br | Laudos e Obras Elétricas", status: "Pendente" },
  { name: "AÇÃO ENGENHARIA", phone: "(41) 3345-4545", category: "FACILITIES", notes: "Site: http://acaoengenharia.com.br | Impermeabilização e Manutenção", status: "Pendente" },
  
  // JARDINAGEM E PAISAGISMO
  { name: "RAÍZES FLORES E PLANTAS", phone: "(41) 3048-3008", category: "FACILITIES", notes: "Site: https://raizesfloreseplantas.com.br | Manutenção de Jardins", status: "Pendente" },
  { name: "LUZ DO SOL JARDINAGEM", phone: "(41) 3333-8888", category: "FACILITIES", notes: "Site: http://luzdosoljardim.com.br | Paisagismo", status: "Pendente" },
  { name: "JOTA JARDINAGEM", phone: "(41) 99999-7777", category: "FACILITIES", notes: "Site: http://jotajardinagem.com.br | Limpeza de Terrenos", status: "Pendente" },
  { name: "FLORESTAL JARDINAGEM", phone: "(41) 3014-1414", category: "FACILITIES", notes: "Site: http://florestaljardinagem.com.br | Conservação de Áreas Verdes", status: "Pendente" },
  { name: "LM JARDINAGEM", phone: "(41) 99201-5326", category: "FACILITIES", notes: "Site: http://lmjardinagem.com.br | Manutenção Residencial e Comercial", status: "Pendente" },
  
  // LIMPEZA EM ALTURA E FACHADA
  { name: "PRO ALTO", phone: "(41) 3278-4080", category: "FACILITIES", notes: "Site: https://proalto.com.br | Limpeza de Fachadas e Vidros em Altura", status: "Pendente" },
  { name: "TOP TEAM BRASIL", phone: "(41) 3322-5208", category: "FACILITIES", notes: "Site: https://topteambrasil.com.br | Alpinismo Industrial", status: "Pendente" },
  { name: "REVEMIX PINTURAS", phone: "(41) 99894-9795", category: "FACILITIES", notes: "Site: http://revemixpinturas.com.br | Recuperação de Fachadas", status: "Pendente" },
  { name: "GLASS SERVICES", phone: "(41) 99505-4935", category: "FACILITIES", notes: "Site: http://glassservices.com.br | Limpeza Técnica de Vidros", status: "Pendente" },
  { name: "LAVAGEM PREDIAL", phone: "(41) 3073-9971", category: "FACILITIES", notes: "Site: http://lavagempredial.com.br | Hidrojateamento de Fachadas", status: "Pendente" },
  
  // OUTRAS FACILITIES VALIDAS
  { name: "INFINITY HIGIENIZAÇÕES", phone: "(41) 3100-2020", category: "FACILITIES", notes: "Site: http://infinityhigienizacoes.com.br | Limpeza Profissional", status: "Pendente" },
  { name: "MACROCLEAN LIMPEZA", phone: "(41) 3222-1010", category: "FACILITIES", notes: "Site: http://macroclean.com.br | Know-how 20 anos", status: "Pendente" },
  { name: "OPERACIONAL PORTARIA", phone: "(41) 3333-1111", category: "FACILITIES", notes: "Site: http://operacionalpr.com.br | Serviços de Zeladoria", status: "Pendente" },
  { name: "ABS MANUTENÇÃO", phone: "(41) 3014-5050", category: "FACILITIES", notes: "Site: http://absmanutencao.com.br | Manutenção Elétrica e Mecânica", status: "Pendente" },
  { name: "VANGUARDA SERVIÇOS", phone: "(41) 3333-2222", category: "FACILITIES", notes: "Site: http://vanguardaservicos.com.br | Monitoramento e Limpeza", status: "Pendente" },
  { name: "WORLD SERV", phone: "(41) 3222-3333", category: "FACILITIES", notes: "Site: http://worldserv.com.br | Mão de obra terceirizada", status: "Pendente" },
  { name: "HELP HOME CURITIBA", phone: "(41) 3055-6677", category: "FACILITIES", notes: "Site: https://helphome.com.br | Reparos e Reformas", status: "Pendente" },
  { name: "REDE REPARO", phone: "(41) 3333-9999", category: "FACILITIES", notes: "Site: http://redereparo.com.br | Manutenção Hidráulica", status: "Pendente" },
  { name: "FACHADA LIMPA", phone: "(41) 3222-0000", category: "FACILITIES", notes: "Site: http://fachadalimpa.com.br | Limpeza de Vidros", status: "Pendente" },
  { name: "PLANALTO FACILITIES", phone: "(41) 3111-2222", category: "FACILITIES", notes: "Site: http://planaltofacilities.com.br | Terceirização Geral", status: "Pendente" },
  { name: "CURITIBA LIMPEZA", phone: "(41) 3044-5566", category: "FACILITIES", notes: "Site: http://curitibalimpeza.com.br | Pós-obra Especializado", status: "Pendente" },
  { name: "PRIME FACILITIES", phone: "(41) 3222-1111", category: "FACILITIES", notes: "Site: http://primefacilities.com.br | Apoio Administrativo", status: "Pendente" },
  { name: "DELTA FACILITIES", phone: "(41) 3333-4444", category: "FACILITIES", notes: "Site: http://deltafacilities.com.br | Segurança e Limpeza", status: "Pendente" },
  { name: "MASTER SERVIÇOS", phone: "(41) 3015-1515", category: "FACILITIES", notes: "Site: http://masterservicos.com.br | Portaria 24h", status: "Pendente" },
  { name: "GELP FACILITIES", phone: "(41) 3222-8888", category: "FACILITIES", notes: "Site: http://gelp.com.br | Gestão de Mão de Obra", status: "Pendente" },
  { name: "UNIÃO FACILITIES", phone: "(41) 3333-0000", category: "FACILITIES", notes: "Site: http://uniaofacilities.com.br | Serviços Prediais", status: "Pendente" },
  { name: "CONSERVADORA PARANAENSE", phone: "(41) 3222-5555", category: "FACILITIES", notes: "Site: http://conservadoraparanaense.com.br | Tradicional em Curitiba", status: "Pendente" },
  { name: "LIMPMAX", phone: "(41) 3022-3344", category: "FACILITIES", notes: "Site: http://limpmax.com.br | Limpeza de Escritórios", status: "Pendente" },
  { name: "TECNOLIMP", phone: "(41) 3333-2211", category: "FACILITIES", notes: "Site: http://tecnolimp.com.br | Tecnologia em Limpeza", status: "Pendente" },
  { name: "QUALITÀ SERVIÇOS", phone: "(41) 3018-9900", category: "FACILITIES", notes: "Site: http://qualitaservicos.com.br | Portaria e Limpeza", status: "Pendente" },
  { name: "SOLUÇÃO FACILITIES", phone: "(41) 3222-7777", category: "FACILITIES", notes: "Site: http://solucaofacilities.com.br | Terceirização", status: "Pendente" },
  { name: "EFICIÊNCIA SERVIÇOS", phone: "(41) 3333-6655", category: "FACILITIES", notes: "Site: http://eficienciaservicos.com.br | Apoio Operacional", status: "Pendente" },
  { name: "ALVO FACILITIES", phone: "(41) 3044-1122", category: "FACILITIES", notes: "Site: http://alvofacilities.com.br | Segurança Eletrônica", status: "Pendente" },
  { name: "AGUIA FACILITIES", phone: "(41) 3222-9988", category: "FACILITIES", notes: "Site: http://aguiafacilities.com.br | Limpeza de Fachada", status: "Pendente" },
  { name: "FORTE FACILITIES", phone: "(41) 3333-8877", category: "FACILITIES", notes: "Site: http://fortefacilities.com.br | Zeladoria e Portaria", status: "Pendente" },
  { name: "VIP FACILITIES", phone: "(41) 3014-4455", category: "FACILITIES", notes: "Site: http://vipfacilities.com.br | Serviços de Luxo", status: "Pendente" },
  { name: "EXCELLENCE SERVIÇOS", phone: "(41) 3222-1234", category: "FACILITIES", notes: "Site: http://excellenceservicos.com.br | Terceirização Qualificada", status: "Pendente" },
  { name: "SUPORTE FACILITIES", phone: "(41) 3333-5678", category: "FACILITIES", notes: "Site: http://suportefacilities.com.br | Manutenção Predial", status: "Pendente" },
  { name: "GLOBAL FACILITIES", phone: "(41) 3044-9876", category: "FACILITIES", notes: "Site: http://globalfacilities.com.br | Gestão Completa", status: "Pendente" }
];

async function importBatch2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Lote 2...");

    for (const lead of batch2Leads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado Lote 2: ${lead.name}`);
      } else {
        console.log(`Pulado Lote 2 (já existe): ${lead.name}`);
      }
    }

    console.log("Lote 2 concluído!");
    process.exit(0);
  } catch (err) {
    console.error("Erro no Lote 2:", err);
    process.exit(1);
  }
}

importBatch2();
