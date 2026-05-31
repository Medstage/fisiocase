# FisioCase — Mapa de telas do Stitch

**Projeto oficial:** `FisioCase: IA em Fisioterapia` → `projects/18015761223185780484`

Para puxar o design de uma tela durante a implementação, usar o MCP do Stitch:
`get_screen` com o `name` abaixo (retorna HTML + screenshot).

## Telas desktop
| Tela (spec) | Título no Stitch | Screen ID (`projects/18015761223185780484/screens/...`) |
|---|---|---|
| Login/Cadastro | Login e Cadastro | `9da0137866e844ab9c85e2656986c85d` |
| Dashboard | Dashboard Principal | `204ae1d02ea54346aa06f05543a75b68` |
| Novo caso | Configurar Novo Caso | `c43073a40d6145239a5a5050664311c4` |
| Caso clínico | Resolução de Caso | `daeab0468c674a8083bbb571fd417c93` |
| Feedback | Feedback do Caso | `e05f17a6709644f886392ab98feaa04a` |
| Ranking | Ranking e Gamificação | `3235a51fbcdd452cac1d419d4d0edb13` |
| Perfil | Perfil do Usuário | `beff75f403b84846a6a475f0b33c20f1` |
| Admin | Painel Administrativo | `dca42b5ea18247aeb917912c0c6577d8` |

## Telas mobile
| Tela | Screen ID |
|---|---|
| Login e Cadastro (Mobile) | `210ec22399324f15a6d175f27e74a926` |
| Dashboard (Mobile) | `8ce700dc772f4d7486f47e35ad840286` |
| Configurar Novo Caso (Mobile) | `c1594b78e1994b158845b903a237fde6` |
| Resolução de Caso (Mobile) | `1a26981e7dce415ab14f0f5d7c1bf1eb` |
| Feedback do Caso (Mobile) | `3d915dfafce3411d94f37b110f437593` |
| Ranking (Mobile) | `e6c6571611d64810962fd947723a42f7` |
| Perfil do Usuário (Mobile) | `1e87f8c60ecd448d952e8c07ea02ded9` |
| Painel Administrativo (Mobile) | `c8205c1e29b54787b51c15375acd5c33` |

## Telas da spec ainda NÃO desenhadas no Stitch (derivar do design system)
- Recuperar senha / Nova senha
- Histórico
- Conquistas
- Editar perfil
- Configurações
- Admin: criar-caso, gerenciar-casos, respostas, usuários, analytics

> Opção: gerar essas telas faltantes no Stitch com `generate_screen_from_text`
> usando o mesmo design system (`designSystem` do projeto), para manter consistência.
