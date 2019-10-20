const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const csvtojson = require('csvtojson')

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();

const app = express();
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send({
        "Test": "Test message"
    });
})

const gerarIdn = (membros) => {
    membros.sort((a, b) => {
        return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0;
    });

    // arrumar de pegar isso do bd
    var times_counter = {
        "Voluntários": 0,
        "Ação Social": 0,
        "Arrecadação": 0,
        "Eventos": 0,
        "Financeiro": 0,
        "Logística": 0,
        "Marketing": 0,
        "Qualidade": 0,
        "Recursos Humanos": 0,
        "Sacolinhas": 0
    };

    // poder adicionar times novos
    var times_codigo = {
        "Voluntários": "000",
        "Ação Social": "001",
        "Arrecadação": "002",
        "Eventos": "003",
        "Financeiro": "004",
        "Logística": "005",
        "Marketing": "006",
        "Qualidade": "007",
        "Recursos Humanos": "008",
        "Sacolinhas": "009"
    };

    // mudar isso
    const ano = 19;

    membros.forEach(membro => {
        const time = times_codigo[membro.time];
        const alfabetico = ++times_counter[membro.time];

        membro["idn"] = `${ano}${time}${("00" + alfabetico).slice (-3)}`;
        console.log(membro['idn']);
    })

    return membros;
}

app.post('/api/add-users', (req, res) => {
    req.body = [{
            "nome": "Abraao Jose",
            "email": "abraao@mail.com",
            "time": "Ação Social",
            "aniversario": "01/01/2001"
        },
        {
            "nome": "José da silva",
            "email": "jose@mail.com",
            "time": "Arrecadação",
            "aniversario": "01/01/2001"
        },
        {
            "nome": "Víctor Cora",
            "email": "victorcora98@gmail.com",
            "time": "Arrecadação",
            "aniversario": "18/05/1998"
        },
        {
            "nome": "Bartolomeu",
            "email": "bart@mail.com",
            "time": "Eventos",
            "aniversario": "01/01/2001"
        }
    ]
    const membros = gerarIdn(req.body);
    let ref = db.collection('users');
    membros.forEach((pessoa) => {
        ref.doc(pessoa.idn).set(pessoa);
        admin.auth().createUser({
            email: pessoa.email,
            emailVerified: false,
            password: pessoa.aniversario,
            displayName: pessoa.nome,
            disabled: false
        }).then((userRecord) => {
            console.log("Successfully created new user:", userRecord.uid);
            return null;
        }).catch(err => {
            return err;
        })
    });
});

app.get('/api/get-user', (req, res) => {
    const idn = req.query.idn;
    let ref = db.collection('users').doc(idn);
    let getDoc = ref.get()
        .then(doc => {
            res.send(doc._fieldsProto);
            return null;
        })
        .catch(err =>
            res.send(err)
        )
})

app.post('/api/add-message', (req, res) => {
    console.log(req.body);
    const timestamp = new Date().getTime();
    req.body.times.forEach((time) => {
        var ref = db.collection('mensagens');
        ref.doc(`${time}`).collection('mensagens').doc(`${timestamp}-${req.body.title}`).set(req.body);
    });
});

app.get('/api/get-messages', (req, res) => {
    console.log(req.query);
    const time = req.query.time;
    let ref = db.collection('mensagens').doc(time).collection('mensagens');
    var result = [];
    let all = ref.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                result = result.concat(doc);
            })
            res.send(result);
            return null;
        })
        .catch(err => {
            console.log(err);
            res.send("Error getting docs");
        });
});

const cleanCSV = (csvString) => {
    // const text = csvString.match(/Time[^]*/g).toString();
    const text = csvString.toString();
    let splitArray = text.split('\n');
    let result = splitArray.join('\n');
    return result;
}

app.post('/add-members', (req, res) => {
    const csv = cleanCSV(req.body.toString());
    console.log(csv);
    return res.send(csv);
});

exports.api = functions.https.onRequest(app);