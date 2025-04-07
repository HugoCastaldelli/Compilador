const editor = document.getElementById("code_editor");
const line_numbers = document.getElementById("line_numbers");
const table_container = document.getElementById("table_container");
const file_chooser = document.getElementById("file_chooser"); 


document.getElementById("dowload_btn").addEventListener("click", function() {
    var conteudo = editor.innerText;
    
    var blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    link.download = "code.txt";
    
    link.click();
    
    URL.revokeObjectURL(link.href);
});

file_chooser.addEventListener("change", (event) => {
    const arquivo = event.target.files[0];
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
          const conteudo = e.target.result;
          editor.textContent = conteudo;
        };
        leitor.readAsText(arquivo);
        
      }
      

      update_line_numbers();
})

function Criar_tabela_lexemas(table){
    Syntatic_table = [...table];
    Syntatic_table.shift();
    Syntatic_table.forEach((value,index) => {
        Syntatic_table[index] = Syntatic_table[index].slice(0,2);
    });
}

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
    var new_table = document.createElement("table");
    document.getElementById("table_container").appendChild(new_table);
}

function create_table(content) {
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var thd = function(i){return (i==0)?"th":"td";};
    for (var i=0;i<content.length;i++) {
      var tr = document.createElement("tr");
      for(var j=0;j<content[i].length;j++){
        var t = document.createElement(thd(i));
        var texto=document.createTextNode(content[i][j]);
        t.appendChild(texto);
        tr.appendChild(t);

        if(content[i][1] === "Error"){
            tr.setAttribute("class","error_line");
        }
      }
      (i==0)?thead.appendChild(tr):tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

function generateTableContent(code) {
    const table_content = [
        ["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"]
    ];

    const reservedWords = ["program", "procedure", "var", "int", "boolean", "read", "write", "true", "false", 
                           "begin", "end", "if", "then", "else", "while", "do", "or", "and", "not"];

    const tokens = {};

    reservedWords.forEach(word => {
        tokens[word] = `reserved word ${word}`;
    });

    tokens[";"] = "end of line";
    tokens[","] = "comma";

    tokens["."] = "End of program";
  
    tokens["("] = "open parentheses";
    tokens[")"] = "close parentheses";
    tokens["="] = "equal to";
    tokens["<>"] = "not equal to";
    tokens[">"] = "greater than";
    tokens["<"] = "less than";
    tokens[">="] = "equal or greater than";
    tokens["<="] = "equal or less than";
    tokens[":="] = "assignment";
    tokens[":"] = "vartype";
    
    const reg_var = /^([a-zA-Z_][a-zA-Z0-9_]{0,24})$/;
    const reg_int = /^(0|[1-9][0-9]{0,24})$/;
    const reg_float = /^([0-9]+\.[0-9]+)$/;
    const operator = /^([+\-*/])$/;
    
    const lines = code.split("\n");
    let code_html = "";

    lines.forEach((line, lineIndex) => {
        let colStart = 0;
        let formattedLine = "";
        const words = line.match(/>=|<=|<>|:=|\/\/|\d+\.\d+|\w+|\S/g) || [];
        
        let lastIndex = 0;
        words.forEach(word => {
            if (word.trim() !== "") {
                let tokenType;
                let spanClass = "";
                if (tokens[word]) {
                    tokenType = tokens[word];
                    spanClass = "reserved_word";
                } else if (reg_int.test(word)) {
                    tokenType = "integer";
                    spanClass = "number";
                } else if (reg_var.test(word)) {
                    tokenType = "variable";
                    spanClass = "variable";
                } else if (operator.test(word)) {
                    tokenType = "operator";
                    spanClass = "operator";
                } else {
                    tokenType = "Error";
                    spanClass = "error";
                }
                
                const wordIndex = line.indexOf(word, lastIndex);
                formattedLine += line.substring(lastIndex, wordIndex);
                formattedLine += `<span class="${spanClass}" spellcheck="false">${word}</span>`;
                lastIndex = wordIndex + word.length;
                
                const colEnd = colStart + word.length - 1;
                table_content.push([word, tokenType, lineIndex + 1, colStart + 1, colEnd + 1]);
            }
            colStart += word.length + 1;
        });
        
        formattedLine += line.substring(lastIndex); // Adiciona qualquer espaço em branco restante
        code_html += formattedLine + "\n"; // Mantém a quebra de linha original
    });

    editor.innerHTML = code_html;
    return table_content;
}

function analizador_lexico(){
    let code = editor.innerText;
    let j = 0;

    while(j <= code.length){
        if (code[j] === "}"){
            j++;
        }
        while (j <= code.length && code[j] != "{"){
            j++;
        };
        let commentStart_index = j;
        while (j <= code.length && code[j] != "}"){
            j++;
        }
        let commentEnd_index = j;

        if (j > code.length){
            break;
        }
        code = code.slice(0,commentStart_index) + code.slice(commentEnd_index+1,code.length);
        j = j - (commentEnd_index - commentStart_index);
    } 
    let i = 0;
    while(i <= code.length){
        while (i <= code.length && !(code[i] === "/" && code[i+1] === "/")){
            i++;
        };
        let comment_start_index = i;
        while (i <= code.length && code[i] != "\n"){
            i++;
        }
        let comment_end_index = i;
        code = code.slice(0,comment_start_index) + code.slice(comment_end_index+1,code.length);
        i = i - (comment_end_index - comment_start_index);
    } 
    
    const table_content = generateTableContent(code);
    table_container.innerText = "";
    table_container.appendChild(create_table(table_content));


    // code = "<span class=\"error\">" + code +"</span>";
    // editor.innerHTML = code;
    // console.log(editor.innerText);
    // console.log(editor.innerHTML);
}

document.getElementById("dowload_btn").addEventListener("click", function() {
    var conteudo = editor.innerText;
    
    var blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    link.download = "code.txt";
    
    link.click();
    
    URL.revokeObjectURL(link.href);
});
