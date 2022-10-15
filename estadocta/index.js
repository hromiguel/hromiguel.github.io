const sqlPromise = initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`   
   });

const dataPromise = fetch("../datos.base")
   .then(res => res.arrayBuffer());
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));	 

const socios = leeSocios();
let codtrans= [];
codtransacion();


document.querySelector('#prevButton').addEventListener('click', previousPage, false);

async function codtransacion() {
    const  select = `SELECT * FROM codtransacion `;
    codtrans = await leerTodo(db, select);
} 

async function leeSocios()  {
  const  select = `SELECT lote FROM socios `;
  const data = await leerTodo(db, select);
  loteOpc(data); 
}  

function previousPage() {
    const cLote = document.getElementById("lote").value;
    getData(cLote.trim());
    //  renderTable(cLote.trim());
  }

function leerTodo(db, select) {
    const stmt = db.prepare(select);
    let rows = [];
    while(stmt.step()) { 
      const row = stmt.getAsObject();
      rows.push(row);
   }
   return rows;
 }		

 function loteOpc(socios) {
    let lote = document.getElementById('ĺote');
    let optionLote = document.getElementById('lote').options;
        socios.forEach(option =>
            optionLote.add(
                new Option(option.lote, option.lote)
            )
        );
 } 

 async function getData(lote) {
    const  select = `SELECT * FROM movimientos
                        WHERE lote = $lote 
                        ORDER BY fecha DESC, codtran, tipotran `;
    
    const stmt = db.prepare(select);
    let rows = [];
    const cLote = lote;
    const salida = document.getElementById('salida');  
    stmt.bind({$lote:cLote});
    while(stmt.step()) { 
      const row = stmt.getAsObject();
      rows.push(row);
    }
    stmt.free();
    if (rows.length > 0) {
      const mov = getLinea(rows);
      salida.innerHTML = json2Table(mov)
    } else {
      const lineaBlanca = [{
          fecha: new Date().toLocaleDateString('es-ES')

        }];
        salida.innerHTML = json2Table(lineaBlanca)
    }
 }

 function formatDate(stringDate){
    var date=new Date(stringDate);
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' +  date.getFullYear();
}
 
 function getLinea(data) {

  let saldo = 0;
  const movimientos = data.map(function (movimiento) {
    let linea = {};
    
    const codigoTran = codtrans.find(element => element.trancodigo === movimiento.codtran);
    linea.descripcion = codigoTran.descripcion;

    if (movimiento.tipotran === 'pago') {
      linea.deuda = 0;
      linea.pago = movimiento.valor;
      saldo += movimiento.valor
      linea.saldo = saldo;
    } else {
      linea.deuda = movimiento.valor;
      linea.pago = 0;
      saldo -= movimiento.valor;
      linea.saldo = saldo;
    }
    linea.fecha = formatDate(movimiento.fecha);
    return linea;
  });
  return movimientos; 
};

function json2Table(json) {
  let cols = Object.keys(json[0]);


  //Map over columns, make headers,join into string
  let headerRow = cols
    .map(col => `<th>${col}</th>`)
    .join("");

  //map over array of json objs, for each row(obj) map over column values,
  //and return a td with the value of that object for its column
  //take that array of tds and join them
  //then return a row of the tds
  //finally join all the rows together
  let rows = json
    .map(row => {
      let tds = cols.map(col => `<td>${row[col]}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  //build the table
  const table = `
  <table>
    <thead>
      <tr>${headerRow}</tr>
    <thead>
    <tbody>
      ${rows}
    <tbody>
  <table>`;

  return table;
}
