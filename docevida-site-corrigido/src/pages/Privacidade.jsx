import LegalPage from "../components/LegalPage";

// Texto-base elaborado pela equipe. Recomenda-se revisão por profissional jurídico antes da operação comercial.
const SECTIONS = [
    ["Quem somos", ["A DoceVida é uma pequena empresa de chocolates e doces artesanais de Cidade Tiradentes, São Paulo. Esta política explica como tratamos os dados pessoais de quem usa este site, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018)."]],
    ["Quais dados coletamos", ["Coletamos apenas o que é necessário para atender o seu pedido:", ["Nome e telefone (com DDD);", "Endereço completo, somente quando você escolhe entrega;", "Itens do pedido, data e horário desejados, observações e sua preferência de contato."], "Não pedimos CPF, dados de cartão nem senhas de clientes. O site não usa ferramentas de publicidade nem de rastreamento."]],
    ["Para que usamos", [["Receber, confirmar, preparar e entregar ou separar para retirada o seu pedido;", "Entrar em contato sobre o pedido (valores, taxa de entrega, horário);", "Permitir que você acompanhe o pedido pelo código recebido;", "Cumprir obrigações legais e organizar o atendimento da loja."], "Não vendemos nem alugamos seus dados."]],
    ["Base legal", ["Tratamos seus dados para executar o pedido que você solicitou e, quando necessário, para cumprir obrigações legais ou com o seu consentimento."]],
    ["Com quem compartilhamos", ["Os dados do pedido ficam acessíveis à equipe da DoceVida que cuida do atendimento. Também podem ser tratados por empresas que fornecem a hospedagem e a infraestrutura do site e por serviços de mensagem, como o WhatsApp, quando você opta por falar com a gente por lá. Links para outros sites (como Instagram e Google Forms) seguem as políticas próprias de cada serviço."]],
    ["Dados guardados no seu navegador", ["O carrinho, os códigos dos seus pedidos e o progresso do jogo Doces Match ficam salvos apenas no seu aparelho (armazenamento local). Você pode apagá-los limpando os dados do navegador. Usamos cookies somente para o funcionamento da área administrativa da loja."]],
    ["Por quanto tempo guardamos", ["Guardamos os dados pelo tempo necessário para atender o pedido, resolver eventuais dúvidas e cumprir obrigações legais. Depois disso, eles são apagados ou anonimizados."]],
    ["Seus direitos", ["Você pode pedir, a qualquer momento:", ["Confirmação de que tratamos seus dados e acesso a eles;", "Correção de dados incompletos ou errados;", "Eliminação dos dados, quando não houver obrigação de guardá-los;", "Informações sobre com quem compartilhamos;", "Revogação do consentimento, quando for o caso."], "@contato"]],
    ["Segurança", ["Adotamos medidas técnicas para proteger os dados, como acesso restrito à área administrativa e comunicação protegida. Nenhum sistema é totalmente imune a falhas, mas nos comprometemos a agir rapidamente se algo acontecer."]],
    ["Mudanças nesta política", ["Podemos atualizar este texto quando o site mudar. A data da última atualização fica sempre no topo da página."]],
];

export default function Privacidade() {
    return <LegalPage title="Política de Privacidade" description="Como a DoceVida trata os dados pessoais de quem faz pedidos pelo site." updated="novembro de 2026" sections={SECTIONS} />;
}
