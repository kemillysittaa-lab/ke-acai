// ======================================
// KE AÇAÍ - DELIVERY
// ======================================

const SUPABASE_URL = "https://ncukfroazgjnwvrmzxyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_T9oyWTb31mxJybxM09Z81A_AoXqfdig";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const whatsapp = "5516996211605";

let carrinho = [];

let cupomAplicado = null;
let valorDesconto = 0;

async function validarCupom() {

    const campo = document.getElementById("codigo-cupom");
    const mensagem = document.getElementById("mensagem-cupom");

    const codigo = campo.value.trim().toUpperCase();

    if (!codigo) {
        mensagem.textContent = "Digite um cupom.";
        return;
    }

    const total = carrinho.reduce(function(soma, item) {
        return soma + item.preco;
    }, 0);

    if (total <= 0) {
        mensagem.textContent = "Adicione produtos ao carrinho primeiro.";
        return;
    }

    const { data, error } = await supabaseClient.rpc(
        "validar_cupom",
        {
            p_codigo: codigo,
            p_total: total
        }
    );

    if (error) {
        console.error(error);
        mensagem.textContent = "Não foi possível validar o cupom.";
        return;
    }

    if (!data || data.length === 0) {

        cupomAplicado = null;
        valorDesconto = 0;

        document.getElementById("valor-desconto").textContent =
            dinheiro(0);

        mensagem.textContent =
            "Cupom inválido ou não disponível.";

        atualizarCarrinho();
        return;
    }

    const cupom = data[0];

    cupomAplicado = cupom;

    if (cupom.tipo === "percentual") {
        valorDesconto =
            total * (Number(cupom.valor) / 100);
    } else {
        valorDesconto = Number(cupom.valor);
    }

    if (valorDesconto > total) {
        valorDesconto = total;
    }

    document.getElementById("valor-desconto").textContent =
        "-" + dinheiro(valorDesconto);

    mensagem.textContent =
        "Cupom aplicado com sucesso! 💜";

    atualizarCarrinho();
}

document
    .getElementById("aplicar-cupom")
    .addEventListener("click", validarCupom);


// FORMATA VALORES

function dinheiro(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ======================================
// PRODUTOS PRONTOS
// ======================================

const botoesProduto =
    document.querySelectorAll(
        ".adicionar-produto"
    );


botoesProduto.forEach(function(botao) {

    botao.addEventListener(
        "click",
        function() {

            const produto =
                botao.closest(".produto");


            const nome =
                produto.querySelector("h3")
                    .innerText;


            const select =
                produto.querySelector(
                    ".tamanho-produto"
                );


            const opcao =
                select.options[
                    select.selectedIndex
                ];


            const tamanho =
                opcao.dataset.tamanho;


            const preco =
                Number(opcao.value);


            carrinho.push({

                nome: nome,

                tamanho: tamanho,

                adicionais: [],

                preco: preco

            });


            atualizarCarrinho();


            alert(
                nome +
                " adicionado ao carrinho! 💜"
            );

        }
    );

});


// ======================================
// MONTE SEU KE
// ======================================

const tamanhoMonte =
    document.getElementById(
        "tamanho-monte"
    );


const adicionais =
    document.querySelectorAll(
        ".checkbox-adicional"
    );


const totalMontagem =
    document.getElementById(
        "total-montagem"
    );


function calcularMontagem() {

    let total =
        Number(tamanhoMonte.value);


    adicionais.forEach(
        function(adicional) {

            if (adicional.checked) {

                total +=
                    Number(adicional.value);

            }

        }
    );


    totalMontagem.innerText =
        dinheiro(total);


    return total;

}


tamanhoMonte.addEventListener(
    "change",
    calcularMontagem
);


adicionais.forEach(
    function(adicional) {

        adicional.addEventListener(
            "change",
            calcularMontagem
        );

    }
);


// ADICIONAR MONTADO

document
    .getElementById("adicionar-montado")
    .addEventListener(
        "click",
        function() {

            const opcao =
                tamanhoMonte.options[
                    tamanhoMonte.selectedIndex
                ];


            const tamanho =
                opcao.dataset.tamanho;


            const total =
                calcularMontagem();


            let listaAdicionais = [];


            adicionais.forEach(
                function(adicional) {

                    if (
                        adicional.checked
                    ) {

                        listaAdicionais.push({

                            nome:
                                adicional.dataset.nome,

                            preco:
                                Number(
                                    adicional.value
                                )

                        });

                    }

                }
            );


            carrinho.push({

                nome: "Monte seu Ke",

                tamanho: tamanho,

                adicionais:
                    listaAdicionais,

                preco: total

            });


            atualizarCarrinho();


            alert(
                "Seu Ke foi adicionado ao carrinho! 💜"
            );


            // LIMPAR ADICIONAIS

            adicionais.forEach(
                function(adicional) {

                    adicional.checked =
                        false;

                }
            );


            calcularMontagem();

        }
    );


// ======================================
// CARRINHO
// ======================================

function atualizarCarrinho() {

    const area =
        document.getElementById(
            "itens-carrinho"
        );


    const vazio =
        document.getElementById(
            "carrinho-vazio"
        );


    const totalElemento =
        document.getElementById(
            "total-pedido"
        );


    area.innerHTML = "";


    let total = 0;


    if (carrinho.length === 0) {

        vazio.style.display =
            "block";

    } else {

        vazio.style.display =
            "none";

    }


    carrinho.forEach(
        function(item, indice) {

            total += item.preco;


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "item-carrinho";


            let textoAdicionais = "";


            if (
                item.adicionais.length > 0
            ) {

                textoAdicionais =
                    "<p>Adicionais: " +

                    item.adicionais
                        .map(
                            function(adicional) {

                                return adicional.nome;

                            }
                        )
                        .join(", ") +

                    "</p>";

            }


            div.innerHTML = `

                <div>

                    <h4>
                        ${item.nome}
                    </h4>

                    <p>
                        Tamanho:
                        ${item.tamanho}
                    </p>

                    ${textoAdicionais}

                </div>


                <div class="preco-item">

                    ${dinheiro(item.preco)}

                    <button
                        class="remover"
                        onclick="removerItem(${indice})"
                    >
                        Remover
                    </button>

                </div>

            `;


            area.appendChild(div);

        }
    );


 const totalComDesconto =
    Math.max(0, total - valorDesconto);

totalElemento.innerText =
    dinheiro(totalComDesconto);

}


// REMOVER

function removerItem(indice) {

    carrinho.splice(indice, 1);

    atualizarCarrinho();

}


// ======================================
// PAGAMENTO
// ======================================

const pagamento =
    document.getElementById(
        "pagamento"
    );


const campoTroco =
    document.getElementById(
        "campo-troco"
    );


pagamento.addEventListener(
    "change",
    function() {

        if (
            pagamento.value ===
            "Dinheiro"
        ) {

            campoTroco.style.display =
                "block";

        } else {

            campoTroco.style.display =
                "none";

        }

    }
);


// ======================================
// FINALIZAR
// ======================================

document
    .getElementById("finalizar")
    .addEventListener(
        "click",
    async function() {


            // VERIFICAR CARRINHO

            if (
                carrinho.length === 0
            ) {

                alert(
                    "Adicione pelo menos um açaí ao carrinho. 💜"
                );

                return;

            }


            const nome =
                document.getElementById(
                    "nome"
                ).value.trim();


            const telefone =
                document.getElementById(
                    "telefone"
                ).value.trim();


            const rua =
                document.getElementById(
                    "rua"
                ).value.trim();


            const numero =
                document.getElementById(
                    "numero"
                ).value.trim();


            const bairro =
                document.getElementById(
                    "bairro"
                ).value.trim();


            const complemento =
                document.getElementById(
                    "complemento"
                ).value.trim();


            const formaPagamento =
                pagamento.value;


            const troco =
                document.getElementById(
                    "troco"
                ).value.trim();


            const observacao =
                document.getElementById(
                    "observacao"
                ).value.trim();


            // CAMPOS OBRIGATÓRIOS

            if (
                nome === "" ||
                telefone === "" ||
                rua === "" ||
                numero === "" ||
                bairro === "" ||
                formaPagamento === ""
            ) {

                alert(
                    "Preencha todos os campos obrigatórios da entrega. 💜"
                );

                return;

            }


            // MONTAR MENSAGEM
const itensPedido = carrinho.map(function(item) {

    let texto = item.nome + " - " + item.tamanho;

    if (item.adicionais.length > 0) {
        texto += " + " + item.adicionais
            .map(function(adicional) {
                return adicional.nome;
            })
            .join(", ");
    }

        return texto;

         }).join(" | ");
        
            let mensagem =
                "💜 *NOVO PEDIDO - KE AÇAÍ* 💜\n\n";


            mensagem +=
                "👤 *Cliente:* " +
                nome +
                "\n";


            mensagem +=
                "📱 *Telefone:* " +
                telefone +
                "\n\n";


            mensagem +=
                "🛒 *PEDIDO*\n\n";


            let total = 0;


            carrinho.forEach(
                function(item, indice) {


                    total +=
                        item.preco;


                    mensagem +=
                        (indice + 1) +
                        ". *" +
                        item.nome +
                        "*\n";


                    mensagem +=
                        "🥤 " +
                        item.tamanho +
                        "\n";


                    if (
                        item.adicionais.length > 0
                    ) {

                        mensagem +=
                            "➕ Adicionais:\n";


                        item.adicionais.forEach(
                            function(adicional) {

                                mensagem +=
                                    "   • " +
                                    adicional.nome +
                                    " (" +
                                    dinheiro(
                                        adicional.preco
                                    ) +
                                    ")\n";

                            }
                        );

                    }


                    mensagem +=
                        "💰 " +
                        dinheiro(
                            item.preco
                        ) +
                        "\n\n";

                }
            );


         const totalComDesconto =
    Math.max(0, total - valorDesconto);

if (valorDesconto > 0) {
    mensagem +=
        "🎟️ *Desconto (" +
        cupomAplicado.codigo +
        "): -" +
        dinheiro(valorDesconto) +
        "*\n";
}

mensagem +=
    "💵 *TOTAL DOS PRODUTOS: " +
    dinheiro(totalComDesconto) +
    "*\n";


            mensagem +=
                "🛵 Taxa de entrega: a confirmar\n\n";


            // ENDEREÇO

            mensagem +=
                "📍 *ENDEREÇO DE ENTREGA*\n";


            mensagem +=
                rua +
                ", " +
                numero +
                "\n";


            mensagem +=
                bairro +
                "\n";


            if (
                complemento !== ""
            ) {

                mensagem +=
                    "Complemento: " +
                    complemento +
                    "\n";

            }


            // PAGAMENTO

            mensagem +=
                "\n💳 *Pagamento:* " +
                formaPagamento +
                "\n";


            if (
                formaPagamento ===
                "Dinheiro" &&
                troco !== ""
            ) {

                mensagem +=
                    "💵 Troco para: " +
                    troco +
                    "\n";

            }


            // OBSERVAÇÃO

            if (
                observacao !== ""
            ) {

                mensagem +=
                    "\n📝 *Observação:* " +
                    observacao +
                    "\n";

            }


            mensagem +=
                "\n🛵 *PEDIDO PARA ENTREGA*";

const enderecoCompleto =
    rua + ", " + numero +
    " - " + bairro +
    (complemento ? " - " + complemento : "");

const totalFinal =
    Math.max(0, total - valorDesconto);
        
console.log("CHEGOU NO SUPABASE");
        
const { error: erroPedido } = await supabaseClient
    .from("Pedidos")
    .insert({
        cliente: nome,
        telefone: telefone,
        itens: itensPedido,
        valor_total: totalFinal,
        forma_pagamento: formaPagamento,
        status: "Novo",
        endereco: enderecoCompleto,
        taxa_entrega: 0,
        observacoes: observacao || null
    });

if (erroPedido) {
    console.error(erroPedido);

    alert(
        "Não foi possível registrar o pedido. Tente novamente."
    );


}
            // WHATSAPP

            const texto =
                encodeURIComponent(
                    mensagem
                );


            const link =
                "https://wa.me/" +
                whatsapp +
                "?text=" +
                texto;


            window.open(
                link,
                "_blank"
            );

        }
    );


// INICIAR

calcularMontagem();

atualizarCarrinho();
