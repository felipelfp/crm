const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const schoolsBatch2 = [
  // CURITIBA - NOVAS UNIDADES E ESCOLAS
  { name: "COLÉGIO SANTO ANJO - BARIGUI", phone: "(41) 3279-3000", category: "ESCOLAS", notes: "Site: https://colegiosantoanjo.com.br | Unidade Barigui", status: "Pendente" },
  { name: "COLÉGIO SANTO ANJO - ECOVILLE", phone: "(41) 3339-9000", category: "ESCOLAS", notes: "Site: https://colegiosantoanjo.com.br | Unidade Ecoville", status: "Pendente" },
  { name: "COLÉGIO DYNÂMICO", phone: "(41) 3324-3888", category: "ESCOLAS", notes: "Site: https://dynamico.com.br | Largo da Ordem", status: "Pendente" },
  { name: "ESCOLA WALDORF TURMALINA", phone: "(41) 3285-8876", category: "ESCOLAS", notes: "Site: https://escolaturmalina.org.br | Santa Quitéria", status: "Pendente" },
  { name: "COLÉGIO POSITIVO INTERNACIONAL", phone: "(41) 3317-3000", category: "ESCOLAS", notes: "Site: https://colegiopositivo.com.br | Santa Felicidade", status: "Pendente" },
  { name: "COLÉGIO BOM JESUS SEMINÁRIO", phone: "(41) 2105-4000", category: "ESCOLAS", notes: "Site: https://bomjesus.br | Seminário", status: "Pendente" },
  { name: "COLÉGIO POLIEDRO CURITIBA", phone: "(41) 3044-2001", category: "ESCOLAS", notes: "Site: https://sistemapoliedro.com.br | Batel", status: "Pendente" },
  { name: "COLÉGIO COC CURITIBA", phone: "(41) 3014-1414", category: "ESCOLAS", notes: "Site: http://coccuritiba.com.br | Batel", status: "Pendente" },
  { name: "COLÉGIO ANGLO CURITIBA", phone: "(41) 3322-2211", category: "ESCOLAS", notes: "Site: http://anglocuritiba.com.br | Centro", status: "Pendente" },
  { name: "ESCOLA ATUAÇÃO BOQUEIRÃO", phone: "(41) 3333-1212", category: "ESCOLAS", notes: "Site: https://escolaatuacao.com.br | Boqueirão", status: "Pendente" },
  
  // SÃO JOSÉ DOS PINHAIS
  { name: "COLÉGIO BOM JESUS SÃO JOSÉ", phone: "(41) 2105-4300", category: "ESCOLAS", notes: "Site: https://bomjesus.br | São José dos Pinhais", status: "Pendente" },
  { name: "COLÉGIO ADVENTISTA SJP", phone: "(41) 3035-8200", category: "ESCOLAS", notes: "Site: https://saojosedospinhais.adventista.edu.br | SJP", status: "Pendente" },
  { name: "COLÉGIO SESI SÃO JOSÉ", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | SJP", status: "Pendente" },
  { name: "COLÉGIO OPET SJP", phone: "(41) 3035-1010", category: "ESCOLAS", notes: "Site: https://opet.com.br | SJP", status: "Pendente" },
  
  // PINHAIS
  { name: "COLÉGIO SESI PINHAIS", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Pinhais", status: "Pendente" },
  { name: "COLÉGIO FÊNIX PINHAIS", phone: "(41) 3667-2020", category: "ESCOLAS", notes: "Site: http://colegiofenix.com.br | Pinhais", status: "Pendente" },
  { name: "COLÉGIO SAGRADA FAMÍLIA PINHAIS", phone: "(41) 3667-1010", category: "ESCOLAS", notes: "Site: http://sagradafamilia.com.br | Pinhais", status: "Pendente" },
  
  // COLOMBO
  { name: "COLÉGIO SANTA TEREZINHA COLOMBO", phone: "(41) 3621-1212", category: "ESCOLAS", notes: "Site: http://colegiosantaterezinha.com.br | Colombo", status: "Pendente" },
  { name: "COLÉGIO SESI COLOMBO", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Colombo", status: "Pendente" },
  { name: "COLÉGIO ADVENTISTA COLOMBO", phone: "(41) 3031-8200", category: "ESCOLAS", notes: "Site: https://colombo.adventista.edu.br | Colombo", status: "Pendente" },
  
  // ARAUCÁRIA
  { name: "COLÉGIO SESI ARAUCÁRIA", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Araucária", status: "Pendente" },
  { name: "COLÉGIO MILLENIUM ARAUCÁRIA", phone: "(41) 3642-1010", category: "ESCOLAS", notes: "Site: http://colegiomillenium.com.br | Araucária", status: "Pendente" },
  { name: "COLÉGIO COC ARAUCÁRIA", phone: "(41) 3643-1515", category: "ESCOLAS", notes: "Site: http://coc.com.br | Araucária", status: "Pendente" },
  
  // FAZENDA RIO GRANDE
  { name: "COLÉGIO ACESSO FRG", phone: "(41) 3060-6060", category: "ESCOLAS", notes: "Site: https://colegioacesso.com.br | Fazenda Rio Grande", status: "Pendente" },
  { name: "COLÉGIO SESI FRG", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Fazenda Rio Grande", status: "Pendente" },
  { name: "COLÉGIO ADVENTISTA FRG", phone: "(41) 3060-8200", category: "ESCOLAS", notes: "Site: https://fazendariogrande.adventista.edu.br | FRG", status: "Pendente" },

  // EDUCAÇÃO INFANTIL ESPECIALIZADA (CURITIBA)
  { name: "ESCOLA CASTELINHO BATEL", phone: "(41) 3222-1010", category: "ESCOLAS", notes: "Site: http://escolacastelinho.com.br | Batel", status: "Pendente" },
  { name: "ESCOLA BABY HOUSE", phone: "(41) 3244-1111", category: "ESCOLAS", notes: "Site: http://babyhouse.com.br | Água Verde", status: "Pendente" },
  { name: "ESCOLA CYCLE", phone: "(41) 3333-2222", category: "ESCOLAS", notes: "Site: http://cyclecuritiba.com.br | Batel", status: "Pendente" },
  { name: "ESCOLA DINÂMICA", phone: "(41) 3333-3333", category: "ESCOLAS", notes: "Site: http://escoladinamica.com.br | Santa Felicidade", status: "Pendente" },
  { name: "ESCOLA FOOTSTEPS", phone: "(41) 3016-1616", category: "ESCOLAS", notes: "Site: http://footsteps.com.br | Juvevê", status: "Pendente" },
  { name: "ESCOLA GERAÇÃO", phone: "(41) 3013-1515", category: "ESCOLAS", notes: "Site: http://escolageracao.com.br | Portão", status: "Pendente" },
  { name: "ESCOLA INTERATIVA", phone: "(41) 3222-4455", category: "ESCOLAS", notes: "Site: http://escolainterativa.com.br | Batel", status: "Pendente" },
  { name: "ESCOLA KINDER PARK", phone: "(41) 3014-1414", category: "ESCOLAS", notes: "Site: http://kinderpark.com.br | Rebouças", status: "Pendente" },
  { name: "ESCOLA LÁPIS DE COR", phone: "(41) 3333-5555", category: "ESCOLAS", notes: "Site: http://escolalapisdecor.com.br | Mercês", status: "Pendente" },
  { name: "ESCOLA MONTESSORIANA", phone: "(41) 3252-1010", category: "ESCOLAS", notes: "Site: http://escolamontessori.com.br | Ahoginho", status: "Pendente" },
  { name: "ESCOLA NEW LIFE", phone: "(41) 3022-2222", category: "ESCOLAS", notes: "Site: http://escolanewlife.com.br | Bigorrilho", status: "Pendente" },
  { name: "ESCOLA PEQUENO POLEGAR", phone: "(41) 3333-6666", category: "ESCOLAS", notes: "Site: http://pequenopolegar.com.br | Portão", status: "Pendente" },
  { name: "ESCOLA QUERUBIM", phone: "(41) 3222-8888", category: "ESCOLAS", notes: "Site: http://escolaquerubim.com.br | Centro", status: "Pendente" },
  { name: "ESCOLA RECREIO", phone: "(41) 3014-2020", category: "ESCOLAS", notes: "Site: http://escolarecreio.com.br | Cabral", status: "Pendente" },
  { name: "ESCOLA SABIÁ", phone: "(41) 3333-7777", category: "ESCOLAS", notes: "Site: http://escolasabia.com.br | Jardim Social", status: "Pendente" },
  { name: "ESCOLA TIC TAC", phone: "(41) 3022-3333", category: "ESCOLAS", notes: "Site: http://escolatictac.com.br | Vila Izabel", status: "Pendente" },
  { name: "ESCOLA UNICAMPUS", phone: "(41) 3333-9999", category: "ESCOLAS", notes: "Site: http://unicampus.com.br | Prado Velho", status: "Pendente" },
  { name: "ESCOLA VIVER", phone: "(41) 3015-1515", category: "ESCOLAS", notes: "Site: http://escolaviver.com.br | Bom Retiro", status: "Pendente" },
  { name: "ESCOLA XODÓ", phone: "(41) 3222-0011", category: "ESCOLAS", notes: "Site: http://escolaxodo.com.br | Mercês", status: "Pendente" },
  { name: "ESCOLA YUPE", phone: "(41) 3333-0022", category: "ESCOLAS", notes: "Site: http://yupe.com.br | Seminário", status: "Pendente" },
  { name: "COLÉGIO FÊNIX ARAUCÁRIA", phone: "(41) 3642-2020", category: "ESCOLAS", notes: "Site: http://colegiofenix.com.br | Araucária", status: "Pendente" },
  { name: "COLÉGIO MARISTA ESCOLA SOCIAL BAIRRO ALTO", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://marista.org.br | Bairro Alto", status: "Pendente" },
  { name: "ESCOLA MONTESSORI DE CURITIBA", phone: "(41) 3252-1212", category: "ESCOLAS", notes: "Site: http://montessoridccuritiba.com.br | Juvevê", status: "Pendente" },
  { name: "COLÉGIO SESI CAMPUS DA INDÚSTRIA", phone: "(41) 3271-9000", category: "ESCOLAS", notes: "Site: https://colegiosesi.com.br | Jardim Botânico", status: "Pendente" }
];

async function importBatch2Schools() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado para Lote 2 de Escolas...");

    for (const lead of schoolsBatch2) {
      const exists = await Lead.findOne({ name: lead.name });
      if (!exists) {
        await Lead.create(lead);
        console.log(`Importado: ${lead.name}`);
      } else {
        console.log(`Pulado (duplicado): ${lead.name}`);
      }
    }

    console.log("Lote 2 concluído! +50 escolas adicionadas.");
    process.exit(0);
  } catch (err) {
    console.error("Erro no Lote 2:", err);
    process.exit(1);
  }
}

importBatch2Schools();
