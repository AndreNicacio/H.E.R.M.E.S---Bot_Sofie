const qrcode = require('qrcode-terminal');
let {PythonShell} = require('python-shell');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const pm2 = require('pm2');
const fs = require("fs");

//Função responsável por dar o 'time' antes de cada execução do web_scraping
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  //SEÇÃO DE ACTIONS: sofie
  //Cada action é responsavel pela chamado de um script python que por sua vez
  //faz o acesso ao banco de dados e tambem manipula as informações para gerar os relatórios requisitados
  //uma function action precisa receber um contact como parametro
  
  function IndicacaoAlelo_Solid(contact) {
    console.log('Entrando na  geração de relatorio 1')
    PythonShell.run('scripts_sofie/extracao_indicacao_alelo_solid.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/extracao_indicacao_alelo_solid.xlsx')
    });
  }
  
  function IndicacaoAlelo_LastDay(contact) {
    console.log('Entrando na  geração de relatorio 1')
    PythonShell.run('scripts_sofie/extracao_indicacao_alelo_last_day.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/extracao_indicacao_alelo_last_day.xlsx')
    });
  }
  
  function allApsen(contact) {
    console.log('Entrando na  geração de relatorio 1')
    PythonShell.run('scripts_sofie/all_apsen.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/all_apsen.xlsx')
    });
  }
  
  function TasksReporting(contact) {
    console.log('Entrando na  geração de relatorio 1')
    PythonShell.run('scripts_sofie/reporting_ccc_questions.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/execucoes_ccc_report.xlsx')
    });
  }
  
  function TasksActive(contact) {
    console.log('Entrando na  geração de relatorio 1')
    PythonShell.run('scripts_sofie/qtd_tasks_city.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/tarefas_por_cidade.xlsx')
    });
  }
  
  function allAlelo(contact) {
    console.log('Entrando na  geração de relatorio 2')
    PythonShell.run('scripts_sofie/all_alelo.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/all_alelo.xlsx')
    });
  }
  
  function allExecutions(contact) {
    console.log('Entrando na  geração de relatorio 3')
    PythonShell.run('scripts_sofie/all_execution.py', null, function (err) {
        if (err) console.log(err);  
        sendMedia(contact,'reports_sofie/auditorias_thaylla.xlsx')
    });
  }
  
  
  function countContacts(contact) {
  
    const pyshell = new PythonShell('scripts_sofie/contagem_acessos.py');
    console.log(list_count_contact);
    pyshell.send(list_count_contact);
  
    pyshell.on('message', async function (message) {
      console.log(message);
      msg_to_user = message.replace(/@/g, '\n');
      sendMessage(contact, msg_to_user);     
    }); 
  
    pyshell.end(function (err,code,signal) {
      if (err) console.log(err);
      console.log('finished');
    });
  }
  
  // SEÇÃO DE ACTIONS: alelo
  
  function followUpCCC(contact, nameToFunction) {
  
    const pyshell = new PythonShell('scripts_alelo/acompanhamento_ccc.py');
  
    pyshell.send(nameToFunction);
  
    pyshell.on('message', async function (message) {
      console.log(message);
      msg_to_user = message.replace(/@/g, '\n');
      sendMessage(contact, msg_to_user);   
      await sleep(2000)  
      sendMedia(contact,'reports_alelo/acompanhamento_ccc.xlsx')
    }); 
  
    pyshell.end(function (err,code,signal) {
      if (err) console.log(err);
      console.log('finished');
    });
  }
  

//Função responsavel pela chegamem dos numeros
function isNumeric(num){
    return !isNaN(num)
  }
  
  //Classe Action: GENERALE
  //A classe é responsavel por gerar as opções permitidas ao user pelo bot e por gerar o relátorio requisitado
  //fazendo a chamada de uma action function a classe recebe como parametro
  //nome, id, time, fun
  class Action {
    constructor(name, id, time, fun) {
      this.name = name; this.id = id; this.time = time, this.fun = fun;
    }
  
    getName() {
      return this.name;
    }
  
    getTimeMessage() {
      let minutes = Math.ceil(this.time / 60) + 1;
      let timeMessage = "";
      if (minutes <= 1) {
        timeMessage = "1 minuto";
      } else {
        timeMessage = `${minutes} minutos`;
      }
      return `Ok. Estou preparando o relátorio. Aguarde um instante...`
    }
   }
  
  
  //Lista de green_card(Users com permissão para acessar o bot)
  let alelo_green_card = ['5511975797973', '5511941764643','5511995768602','5511947558440','5511983950738'];
  let sofie_green_card = ['5511933861211', '5511951540462', '14383761548','5511949827165','5527996653686','5511993004086'];
  
  //Listagem de contagem dos contatos 
  let list_count_contact = [];
  
  //Lista de objetos action para o green card sofie
  let sofieActions = [new Action('OPS Lista de Clientes/Acessos', 1, 60, countContacts),new Action('OPS Relatório de Execuções', 2, 120, allExecutions), new Action('OPS Status tarefas Alelo', 3, 60, allAlelo),new Action('OPS Status tarefas Apsen', 4, 60, allApsen),new Action('OPS Report execuções (Respostas sofiers) - CCC', 5, 60, TasksReporting),new Action('OPS Tarefas ativas por cidade (Tarefas por cidade)', 6, 60, TasksActive),new Action('Acompanhamento CCC - GERAL', 7, 60, followUpCCC),new Action('Acompanhamento CCC - HOJE', 8, 60, followUpCCC),new Action('Acompanhamento CCC - SEMANA', 9, 60, followUpCCC),new Action('Acompanhamento CCC - MÊS', 10, 60, followUpCCC),new Action('Extração de Indicações ALELO - (D-1)', 11, 60, IndicacaoAlelo_LastDay),new Action('Extração de Indicações ALELO - (GERAL)', 12, 60, IndicacaoAlelo_Solid)];
  
  
  //Lista de objetos action para o green card sofie
  let aleloActions = [new Action('Visão de HOJE', 1, 60, followUpCCC),new Action('Visão da SEMANA', 2, 60, followUpCCC),new Action('Visão do MÊS', 3, 60, followUpCCC),new Action('Visão GERAL', 4, 60, followUpCCC)];
  
  
  //Function message: sofie
  //função responsavel por gerir e aplicar as actions de cada green card
  function onSofieMessage(message){
    console.log(message)
    let body = message.body;
    let contact = message.from;
    if (isNumeric(body)) {
      let action = sofieActions.find(item => String(item.id) == body);
      let name = action.getName();
      
      console.log(action)
      if (action == undefined) {
        sendMessage(contact, "Parece que eu não tenho uma ação para isso. Tente outra ação.");
      } else {
        sendMessage(contact, action.getTimeMessage());
        try {
          action.fun(contact, name);
        } catch(error) {
          console.log(error)
          sendMessage(contact, "Opa, parece que tivemos um problema com essa informação. Avise o André :).");
        }
      }
  
    } else {
      let items = '';
  
      sofieActions.forEach(item => {
        items += `${item.id} - ${item.name}\n`
      });
  
      sendMessage(contact, `Olá. Sou o Assistente Sofie e estou aqui para te ajudar. Por favor, escolha uma das ações abaixo:\n${items}`);
    }
  }
  
  
  //Function message: sofie
  
  function onAleloMessage(message, welcome){
    let body = message.body;
    let contact = message.from;
    if (isNumeric(body)) {
      let action = aleloActions.find(item => String(item.id) == body);
      let name = action.getName();
      
      console.log(action)
      if (action == undefined) {
        sendMessage(contact, "Parece que eu não tenho uma ação para isso. Tente outra ação.");
      } else {
        sendMessage(contact, action.getTimeMessage());
        // await delay(200)
        try {
          action.fun(contact,name);
        } catch(error) {
          console.log(error)
          sendMessage(contact, "Opa, parece que tivemos um problema com essa informação. Entre em contato com a Sofie.");
        }
      }
  
    } else {
      let items = '';
  
      aleloActions.forEach(item => {
        items += `${item.id} - ${item.name}\n`
      });
  
      sendMessage(contact, `${welcome}${items}`);
    }
  }
  
  //Function received: generale
  //Aqui nos devolvemos para o user as opções disponivel com base no green_card ao qual ele pertence
  function onMessageReceived(message) {
    let contact = String(message.from).split("@")[0]
    contact_name = String(message.notifyName)
    contact_name += " - " + contact
    if (contact){
      list_count_contact.push(contact_name)
    }
    // setDependencies(client)
    if (sofie_green_card.includes(contact)){
      onSofieMessage(message);
    }else if (alelo_green_card.includes(contact)) {
      let welcome = `Olá. Sou o Assistente Sofie e estou aqui para te ajudar. Por favor, escolha uma das ações abaixo para ter acesso a uma *prévia das visitas executadas*:\n`;      
      onAleloMessage(message,welcome);
    }
  }

  //Função responsavel por reiniciar a instancia caso desconect
  function onCrashBotMakeThat() {
    pm2.restart('sofie-hermes')
  }
  
  function writeReasonCrashJson(reason){
    let object_reason = {
      reason: reason
    }
    fs.writeFile("./crashs_reason.json", JSON.stringify(object_reason), err => {
      // Checking for errors
      if (err) throw err; 
      console.log("Done writing"); // Success
    });
  }


const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {args: ["--no-sandbox"]},
});

client.initialize();

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', (message) => {
    onMessageReceived(message)
});

client.on('disconnected', (reason) => {
  writeReasonCrashJson(reason)
  onCrashBotMakeThat()
});

function sendMessage(contact, message) {
    client.sendMessage(contact, message);
};

function sendMedia(contact, path) {
    const media = MessageMedia.fromFilePath(path);
    client.sendMessage(contact,media);     
};
