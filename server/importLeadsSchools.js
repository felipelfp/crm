const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const schoolsLeads = [
  // GRANDES COLÉGIOS TRADICIONAIS
  { name: "COLÉGIO MARISTA PARANAENSE", phone: "(41) 3271-9300", category: "ESCOLAS", notes: "Site: https://marista.org.br/paranaense | Batel", status: "Pendente" },
  { name: "COLÉGIO MARISTA SANTA MARIA", phone: "(41) 3271-9200", category: "ESCOLAS", notes: "Site: https://marista.org.br/santamaria | São Lourenço", status: "Pendente" },
  { name: "COLÉGIO MEDIANEIRA", phone: "(41) 3218-8000", category: "ESCOLAS", notes: "Site: https://colegiomedianeira.g12.br | Prado Velho", status: "Pendente" },
  { name: "COLÉGIO BOM JESUS LOURDES", phone: "(41) 2105-4000", category: "ESCOLAS", notes: "Site: https://bomjesus.br | Centro", status: "Pendente" },
  { name: "COLÉGIO POSITIVO JARDIM AMBIENTAL", phone: "(41) 3350-3500", category: "ESCOLAS", notes: "Site: https://colegiopositivo.com.br | Juvevê", status: "Pendente" },
  { name: "COLÉGIO ROSÁRIO", phone: "(41) 3322-2615", category: "ESCOLAS", notes: "Site: https://rosariocuritiba.com.br | Centro", status: "Pendente" },
  { name: "COLÉGIO SAGRADO CORAÇÃO DE JESUS", phone: "(41) 3342-1244", category: "ESCOLAS", notes: "Site: https://sagrado.org.br | Água Verde", status: "Pendente" },
  { name: "COLÉGIO SION CURITIBA", phone: "(41) 3222-1374", category: "ESCOLAS", notes: "Site: https://sioncuritiba.com.br | Batel", status: "Pendente" },
  { name: "COLÉGIO VICENTINO MERCÊS", phone: "(41) 3335-5111", category: "ESCOLAS", notes: "Site: https://merces.com.br | Mercês", status: "Pendente" },
  { name: "COLÉGIO DOM BOSCO BATEL", phone: "(41) 3312-7000", category: "ESCOLAS", notes: "Site: https://dombosco.com.br | Batel", status: "Pendente" },
  
  // ESCOLAS INTERNACIONAIS E BILÍNGUES
  { name: "ISC - INTERNATIONAL SCHOOL OF CURITIBA", phone: "(41) 3367-1110", category: "ESCOLAS", notes: "Site: https://iscbrazil.com | Santa Felicidade", status: "Pendente" },
  { name: "COLÉGIO SUÍÇO-BRASILEIRO", phone: "(41) 3271-2550", category: "ESCOLAS", notes: "Site: https://chb.com.br | Pinhais/Curitiba", status: "Pendente" },
  { name: "MAPLE BEAR CURITIBA", phone: "(41) 3042-3001", category: "ESCOLAS", notes: "Site: https://maplebear.com.br | Santa Felicidade", status: "Pendente" },
  { name: "ESCOLA UMBRELLA", phone: "(41) 3343-4343", category: "ESCOLAS", notes: "Site: https://escolatrilhas.com.br | Água Verde", status: "Pendente" },
  { name: "ESCOLA RED BALLOON", phone: "(41) 3016-1616", category: "ESCOLAS", notes: "Site: https://redballoon.com.br | Batel", status: "Pendente" },
  
  // EDUCAÇÃO INFANTIL E BERÇÁRIOS (KIDS)
  { name: "ESCOLA TISTU", phone: "(41) 3352-1616", category: "ESCOLAS", notes: "Site: http://tistu.com.br | Centro Cívico", status: "Pendente" },
  { name: "VILLAGE KIDS", phone: "(41) 3077-1741", category: "ESCOLAS", notes: "Site: http://escolavillagekids.com.br | Capão Raso", status: "Pendente" },
  { name: "GERAÇÃO DO SABER", phone: "(41) 3013-1515", category: "ESCOLAS", notes: "Site: http://geracaodosaber.com.br | Água Verde", status: "Pendente" },
  { name: "CEI UP KIDS", phone: "(41) 3044-5566", category: "ESCOLAS", notes: "Site: http://ceiupkids.com.br | Pinheirinho", status: "Pendente" },
  { name: "ESCOLA ESPAÇO DA CRIANÇA", phone: "(41) 3014-1414", category: "ESCOLAS", notes: "Site: http://escolaespacodacrianca.com.br | Bacacheri", status: "Pendente" },
  { name: "ESCOLA TRILHAS", phone: "(41) 3352-0050", category: "ESCOLAS", notes: "Site: http://escolatrilhas.com.br | Juvevê", status: "Pendente" },
  { name: "ESCOLA TERRA FIRME", phone: "(41) 3362-1010", category: "ESCOLAS", notes: "Site: http://escolaterrafirme.com.br | Hugo Lange", status: "Pendente" },
  { name: "ESCOLA PROJECTO", phone: "(41) 3244-4444", category: "ESCOLAS", notes: "Site: http://escolaprojecto.com.br | Batel", status: "Pendente" },
  
  // COLÉGIOS DE BAIRRO E REDES
  { name: "COLÉGIO ADVENTISTA CENTRO", phone: "(41) 3021-8100", category: "ESCOLAS", notes: "Site: https://curitibacentro.adventista.edu.br | Centro", status: "Pendente" },
  { name: "COLÉGIO ADVENTISTA BOA VISTA", phone: "(41) 3021-8200", category: "ESCOLAS", notes: "Site: https://boavista.adventista.edu.br | Boa Vista", status: "Pendente" },
  { name: "COLÉGIO BAGOZZI", phone: "(41) 3026-1010", category: "ESCOLAS", notes: "Site: https://colegiobagozzi.com.br | Portão", status: "Pendente" },
  { name: "COLÉGIO PASSIONISTA", phone: "(41) 3252-1244", category: "ESCOLAS", notes: "Site: https://passionista.com.br | Ahoginho", status: "Pendente" },
  { name: "COLÉGIO OPET BOM RETIRO", phone: "(41) 3028-2828", category: "ESCOLAS", notes: "Site: https://opet.com.br | Bom Retiro", status: "Pendente" },
  { name: "COLÉGIO ACESSO CENTRO", phone: "(41) 3075-7575", category: "ESCOLAS", notes: "Site: https://colegioacesso.com.br | Centro", status: "Pendente" },
  { name: "COLÉGIO DECISIVO CRISTO REI", phone: "(41) 3363-3363", category: "ESCOLAS", notes: "Site: https://decisivo.com.br | Cristo Rei", status: "Pendente" },
  { name: "COLÉGIO UNIFICADO PORTÃO", phone: "(41) 3014-1415", category: "ESCOLAS", notes: "Site: https://colegiounificado.com.br | Portão", status: "Pendente" },
  { name: "COLÉGIO STELLA MARIS", phone: "(41) 3222-3344", category: "ESCOLAS", notes: "Site: https://colegiostellamaris.com.br | Batel", status: "Pendente" },
  { name: "COLÉGIO MADRE CECÍLIA", phone: "(41) 3366-6633", category: "ESCOLAS", notes: "Site: https://madrececilia.com.br | Tarumã", status: "Pendente" },
  { name: "COLÉGIO MARTINUS CENTRO", phone: "(41) 3322-1044", category: "ESCOLAS", notes: "Site: https://martinus.com.br | Centro", status: "Pendente" },
  { name: "COLÉGIO SENHORA DE FÁTIMA", phone: "(41) 3333-3333", category: "ESCOLAS", notes: "Site: http://colegiosenhoradefatima.com.br | Xaxim", status: "Pendente" },
  { name: "COLÉGIO EXPOENTE ÁGUA VERDE", phone: "(41) 3343-4343", category: "ESCOLAS", notes: "Site: http://expoente.com.br | Água Verde", status: "Pendente" },
  { name: "COLÉGIO SANTA MARIA CENTRO", phone: "(41) 3322-2233", category: "ESCOLAS", notes: "Site: http://colegiosantamaria.com.br | Centro", status: "Pendente" },
  { name: "COLÉGIO DO BOSQUE MANANCIAIS", phone: "(41) 3049-7474", category: "ESCOLAS", notes: "Site: https://bosquemananciais.com.br | Sul", status: "Pendente" },
  { name: "ESCOLA ATUAÇÃO SANTA QUITÉRIA", phone: "(41) 3333-1212", category: "ESCOLAS", notes: "Site: http://escolaatuacao.com.br | Santa Quitéria", status: "Pendente" },
  { name: "COLÉGIO INTEGRAL MERCÊS", phone: "(41) 3335-5151", category: "ESCOLAS", notes: "Site: http://colegiointegral.com.br | Mercês", status: "Pendente" },
  { name: "ESCOLA ISRAELITA BRASILEIRA", phone: "(41) 3352-2255", category: "ESCOLAS", notes: "Site: http://israelita.com.br | Centro Cívico", status: "Pendente" },
  { name: "COLÉGIO NOSSA SENHORA DA GLÓRIA", phone: "(41) 3252-1244", category: "ESCOLAS", notes: "Site: http://colegiogloria.com.br | Alto da Glória", status: "Pendente" },
  { name: "COLÉGIO SÃO JOSÉ CENTRO", phone: "(41) 3222-1122", category: "ESCOLAS", notes: "Site: http://colegiosaojose.com.br | Centro", status: "Pendente" },
  { name: "COLÉGIO SESI PORTÃO", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Portão", status: "Pendente" },
  { name: "COLÉGIO SESI CIC", phone: "(41) 3271-7000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | CIC", status: "Pendente" },
  { name: "COLÉGIO SESI BOQUEIRÃO", phone: "(41) 3271-5000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Boqueirão", status: "Pendente" },
  { name: "COLÉGIO MARISTA ANJO DA GUARDA", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://marista.org.br/anjodaguarda | Santo Inácio", status: "Pendente" },
  { name: "COLÉGIO BOM JESUS DIVINA PROVIDÊNCIA", phone: "(41) 3333-0011", category: "ESCOLAS", notes: "Site: https://bomjesus.br | Ahoginho", status: "Pendente" },
  { name: "ESCOLA CINTRA", phone: "(41) 3222-4455", category: "ESCOLAS", notes: "Site: http://escolacintra.com.br | Portão", status: "Pendente" },
  { name: "ESCOLA PEQUENO PRÍNCIPE", phone: "(41) 3222-1212", category: "ESCOLAS", notes: "Site: http://escolapequenoprincipe.com.br | Batel", status: "Pendente" }
];

async function importSchools() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Importação de Escolas...");

    for (const lead of schoolsLeads) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importada Escola: ${lead.name}`);
      } else {
        console.log(`Pulada (já existe): ${lead.name}`);
      }
    }

    console.log("Importação de 50 escolas concluída!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na importação:", err);
    process.exit(1);
  }
}

importSchools();
