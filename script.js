const editor = document.getElementById("code_editor");
const line_numbers = document.getElementById("line_numbers");
const table_container = document.getElementById("table_container");
const file_chooser = document.getElementById("file_chooser"); 
let Syntatic_table;
let html_content;

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
      setTimeout(() => {
        update_line_numbers();
        update_colors();
    }, "100");
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

function getCaretPosition(editableDiv) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableDiv);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
}

function setCaretPosition(editableDiv, position) {
    const selection = window.getSelection();
    const range = document.createRange();
    let currentPos = 0;

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nextPos = currentPos + node.textContent.length;
            if (nextPos >= position) {
                range.setStart(node, position - currentPos);
                range.collapse(true);
                return true;
            }
            currentPos = nextPos;
        } else {
            for (const child of node.childNodes) {
                if (traverseNodes(child)) return true;
            }
        }
        return false;
    }

    traverseNodes(editableDiv);
    selection.removeAllRanges();
    selection.addRange(range);
}

editor.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();

        // Cria uma nova linha corretamente
        const br = document.createElement("br");
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.insertNode(br); // Insere o <br> na posição atual
        update_line_numbers(); 

        const caretPosition = getCaretPosition(editor);
        update_colors();
        setCaretPosition(editor, caretPosition+1);
    } 
    else if (event.key === "Backspace" || event.key === "Delete") {
        update_line_numbers(); 
    } 
    else if (event.key === " ") {
        const caretPosition = getCaretPosition(editor);
        update_colors();
        setCaretPosition(editor, caretPosition);
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

function criar_tabela_lexemas(table){
    Syntatic_table = [...table];
    Syntatic_table.shift();
    Syntatic_table.forEach((value,index) => {
        Syntatic_table[index] = Syntatic_table[index].slice(0,2);
    });
}

function generateTokens(){
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
    // tokens["{"] = "open comment";
    // tokens["}"] = "close comment";
    tokens["//"] = "comment line";

    return tokens;
}

function generateTableContent(code) {
    const table_content = [["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"]];

    const tokens = generateTokens();

    const reg_var = /^([a-zA-Z_][a-zA-Z0-9_]{0,24})$/;
    const reg_int = /^(0|[1-9][0-9]{0,24})$/;
    const operator = /^([+\-*/])$/;
    
    const lines = code.split("\n");
    let code_html = "";
    let insideCommentBlock = false;

    lines.forEach((line, lineIndex) => {
        let colStart = 0;
        let formattedLine = "";
        const words = line.match(/>=|<=|<>|:=|\/\/.*|\d+\.\d+|\w+|\S/g) || [];

        let lastIndex = 0;
        words.forEach(word => {
            if (word.trim() !== "") {
                let tokenType = "";
                let spanClass = "";

                if (insideCommentBlock) {
                    tokenType = "comment";
                    spanClass = "comment";
                    if (word.includes("}")) { 
                        insideCommentBlock = false;
                    }
                } else if (tokens[word]) {
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
                } else if (word.startsWith("//")) {
                    tokenType = "comment";
                    spanClass = "comment";
                } else if ( word.startsWith("{")) {
                    tokenType = "comment";
                    spanClass = "comment";
                    insideCommentBlock = true;
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
    code_html = code_html.slice(0, -1); // remove o \n extra que estava sobrando

    html_content = code_html;
    criar_tabela_lexemas(table_content);
    return table_content;
}

function remove_comments(code){
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
            code = code.slice(0,commentStart_index)
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
    return code;

}
function analizador_lexico(){
    let code = editor.innerText;

    no_comments_code = remove_comments(code);
    
    const table_content = generateTableContent(no_comments_code);
    table_container.innerText = "";
    table_container.appendChild(create_table(table_content));
}

function update_colors(){
    let code = editor.innerText;
    generateTableContent(code);
    editor.innerHTML = html_content;
}

