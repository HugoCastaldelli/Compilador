const editor = document.getElementById("code_editor");
const line_numbers = document.getElementById("line_numbers");
const table_container = document.getElementById("table_container");
const file_chooser = document.getElementById("file_chooser"); 

file_chooser.addEventListener("change", (event) => {
    const arquivo = event.target.files[0];
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
          const conteudo = e.target.result;
          document.getElementById('code_editor').textContent = conteudo;
        };
        leitor.readAsText(arquivo);
        
      }
      

      update_line_numbers();
})

function update_line_numbers() {
    const lines = editor.innerText.split('\n').length;
    line_numbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
}

editor.addEventListener("input", update_line_numbers);
editor.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        document.execCommand("insertHTML", false, "\n");
        event.preventDefault();
        update_line_numbers();
    }
});

function create_table(){
    const text = "oi 2 a";
    var new_table = document.createElement("table");
    document.getElementById("table_container").appendChild(new_table);
}

function create_table(content) {
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var tbody=document.createElement("tbody");
    var thd=function(i){return (i==0)?"th":"td";};
    for (var i=0;i<content.length;i++) {
      var tr = document.createElement("tr");
      for(var j=0;j<content[i].length;j++){
        var t = document.createElement(thd(i));
        var texto=document.createTextNode(content[i][j]);
        t.appendChild(texto);
        tr.appendChild(t);
      }
      (i==0)?thead.appendChild(tr):tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

// const table_content = [
//     ["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"],
//     ["oi", "variavel", 0, 0, 1],
//     ["if", "palavra reservada", 1, 0, 1],
//     ["oi", "variavel", 1, 3, 4] 
// ]

function generateTableContent(code) {
    const table_content = [
        ["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"]
    ];
    
    const tokens = {
        "if": "palavra reservada",
        "for": "palavra reservada",
        "while": "palavra reservada"

    };
    
    const lines = code.split("\n");
    
    lines.forEach((line, lineIndex) => {
        const words = line.split(/\s+/);
        let colStart = 0;
        
        words.forEach(word => {
            if (word.trim() !== "") {
                const tokenType = tokens[word] || "variavel";
                const colEnd = colStart + word.length - 1;
                
                table_content.push([word, tokenType, lineIndex, colStart, colEnd]);
            }
            colStart += word.length + 1;
        });
    });
    
    return table_content;
}

function analizador_lexico(){
    const code = editor.innerText;
    const table_content = generateTableContent(code);
    table_container.innerText = "";
    table_container.appendChild(create_table(table_content));
    
}


