const editor = document.getElementById("code_editor");
const line_numbers = document.getElementById("line_numbers");
const table_container = document.getElementById("table_container");
const file_chooser = document.getElementById("file_chooser"); 

const lexico_btn = document.getElementById("lexico_btn");
const token_btn = document.getElementById("token_btn");
const tabela_btn = document.getElementById("tabela_btn");
const erros_btn = document.getElementById("erros_btn");
const analisador_btn = document.getElementById("analisador_btn");

let Syntatic_table;
let html_content;

lexico_btn.addEventListener("click", function() {
    Compilar();
});

token_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(Tokenss));
});

tabela_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(TDV));
});

erros_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(Erros));
});

analisador_btn.addEventListener("click", function() {
    table_container.innerText = "";
    Compilar();
    table_container.appendChild(create_table(Analisador_preditivo));
});

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


/*






    Logica do compilador







*/


const reservedWords = ["program", "procedure", "var", "int", "boolean", "read", "write", "true", "false", 
    "begin", "end", "if", "then", "else", "while", "do", "or", "and", "not"];

const reg_var = /^([a-zA-Z_][a-zA-Z0-9_]{0,24})$/;
const reg_int = /^(0|[1-9][0-9]{0,24})$/;
const operator = /^([+\-*/])$/;

let Erros,Analisador_preditivo, Tokenss;

function generateTokens(){
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
    tokens["//"] = "comment line";

    return tokens;
}

function generateTableContent(code) {
    const table_content = [["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"]];

    const tokens = generateTokens();

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
                    tokenType = "Erro lexico";
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

    html_content = code_html; //para as cores

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
    //  TOKEN
    Tokenss = table_content;
}

function update_colors(){
    let code = editor.innerText;
    generateTableContent(code);
    editor.innerHTML = html_content;
}

function transposeMatrix(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function filtrarErrosETriangular(tabela) {
    if (!Array.isArray(tabela) || tabela.length <= 1) return tabela;

    const cabecalho = tabela[0];
    
    // Filtra apenas as linhas que têm "Erro" no início da segunda coluna
    const erros = tabela.slice(1).filter(linha => 
        typeof linha[1] === 'string' && linha[1].startsWith("Erro")
    );

    // Ordena por Linha (índice 2) e Coluna Inicio (índice 3)
    erros.sort((a, b) => {
        const linhaA = parseInt(a[2], 10);
        const linhaB = parseInt(b[2], 10);
        if (linhaA !== linhaB) return linhaA - linhaB;
        return parseInt(a[3], 10) - parseInt(b[3], 10);
    });

    return [cabecalho, ...erros];
}

const TDV = [[''     ,'int'       ,'boolean'   ,'ident'     ,','             ,';'   ,'$'  ],
             ['PDV'  ,'DV ; DV*'  ,'DV ; DV*'  ,'er'        ,'er'            ,'er'  ,''   ],
             ['DV'   ,'int LI'    ,'boolean LI','er'        ,'er'            ,'er'  ,'er' ],
             ['DV*'  ,'DV ; DV*'  ,'DV ; DV*'  ,'er'        ,'er'            ,'er'  ,''   ],
             ['LI'   ,'er'        ,'er'        ,'ident LI*' ,'er'            ,'er'  ,'er' ],
             ['LI*'  ,'er'        ,'er'        ,'er'        ,'\, ident LI*'  ,''    ,'er' ]];

function analizador_sintatico() {
    errors_list = [];

    let matriz_transposta = transposeMatrix(TDV);
    let pilha = ['$'];
    pilha.push(TDV[1][0]);

    let code = editor.innerText;
    let no_comments_code = remove_comments(code);
    const table_content = generateTableContent(no_comments_code);

    let entrada = table_content.map(item => item[0]); // lista de tokens
    entrada.shift();
    entrada.push('$');

    let tabela_sintatica = [["Pilha", "Entrada"]];

    while (pilha[pilha.length - 1] !== '$' && entrada.length > 0) {
        let token = entrada[0];
        let token_original = token;
        
        tabela_sintatica.push([pilha.slice().reverse().join(' '), entrada.join(' ')]);


        // Verifica se é identificador
        if (!TDV[0].includes(token) && reg_var.test(token) && !reservedWords.includes(token)) {
            token = "ident";
        }

        if (pilha[pilha.length - 1] === token) {
            pilha.pop();
            entrada.shift(); // avança no input
        } else if (TDV[0].includes(token) && matriz_transposta[0].includes(pilha[pilha.length - 1])) {
            let index = matriz_transposta[0].indexOf(pilha[pilha.length - 1]);
            pilha.pop();
            let producao = TDV[index][TDV[0].indexOf(token)];
            if (producao !== 'er' && producao !== '') {
                pilha.push(...producao.split(' ').reverse());
            } else if (producao === '') {
                continue;
            }
        } else {
            errors_list.push(entrada[0]);
            entrada.shift(); 
        }
    }

    if (errors_list.length === 0) {
        console.log("Código Válido");
        table_container.innerText = "";
    } else {
        let error_table = table_content;
        errors_list.forEach(erro => {
            let dados_originais = table_content.find(row => row[0] === erro);
    
            if (dados_originais) {
                error_table.push([erro, "Erro sintatico", ...dados_originais.slice(2)]);
            } else {
                error_table.push([erro, "Erro sintatico"]);
            }
        });
    
        const tabela_filtrada = filtrarErrosETriangular(error_table);
        Erros = tabela_filtrada;
    }

    tabela_sintatica.push([pilha.slice().reverse().join(' '), entrada.join(' ')]);
    Analisador_preditivo = tabela_sintatica;
}

function Compilar(){
    table_container.innerText = "";
    analizador_lexico();
    analizador_sintatico();

    // if(errors_list == ""){
    //     alert("Compilado sem erros");
    // }else{
    //     alert("Error");
    // }
}
