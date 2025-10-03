# 🍅 Pomodoro Timer PWA

> Aplicação web progressiva (PWA) de temporizador Pomodoro construída com Angular 20 e Docker para fins de estudo e aprendizado.

## 📋 Descrição do Projeto

Este é um temporizador Pomodoro completo e moderno, desenvolvido como projeto de estudo para aprender Angular (versão 20) e containerização com Docker. A aplicação implementa a técnica Pomodoro, ajudando usuários a gerenciar seu tempo através de sessões de foco intercaladas com pausas.

## 🚀 Stack Tecnológica

### Frontend
- **Angular 20.3.0** - Framework principal
- **TypeScript 5.9.2** - Linguagem de programação
- **RxJS 7.8.0** - Programação reativa
- **SCSS** - Pré-processador CSS
- **Angular Signals** - Gerenciamento de estado reativo
- **Service Worker** - Suporte PWA e funcionalidade offline

### Ferramentas de Desenvolvimento
- **Angular CLI 20.3.2** - Ferramenta de linha de comando
- **Jasmine 5.9.0** - Framework de testes
- **Karma 6.4.0** - Test runner
- **Prettier** - Formatação de código

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx 1.27** - Servidor web de produção
- **Node.js 22** - Ambiente de build

## 🏗️ Arquitetura do Projeto

A aplicação segue uma arquitetura modular e componentizada baseada nas melhores práticas do Angular:

### Estrutura de Componentes Standalone
- Utiliza **standalone components** (novidade do Angular)
- Não requer módulos NgModule tradicionais
- Import direto de dependências nos componentes

### Gerenciamento de Estado com Signals
- **Angular Signals** para reatividade granular
- `signal()` para estado mutável
- `computed()` para valores derivados
- `effect()` para side effects

### Camadas da Aplicação

```
src/app/
├── core/                    # Funcionalidades principais
│   ├── models/             # Interfaces e tipos
│   └── services/           # Serviços compartilhados
├── features/               # Funcionalidades por domínio
│   ├── timer/             # Componente de timer
│   ├── tasks/             # Gerenciamento de tarefas
│   ├── statistics/        # Estatísticas e relatórios
│   └── settings/          # Configurações
└── app.ts                 # Componente raiz
```

### Serviços Principais

- **TimerService**: Gerencia o cronômetro Pomodoro e ciclos
- **TaskService**: CRUD e gerenciamento de tarefas
- **SettingsService**: Configurações do usuário
- **StatisticsService**: Cálculos e métricas de produtividade
- **StorageService**: Persistência local (localStorage)
- **HistoryService**: Histórico de sessões
- **NotificationService**: Notificações do navegador
- **AudioService**: Efeitos sonoros e alertas
- **ThemeService**: Temas visuais
- **WakeLockService**: Previne sleep durante sessões
- **KeyboardShortcutService**: Atalhos de teclado

## 🎯 Funcionalidades Principais

### [x] Timer Pomodoro
- Sessões de trabalho configuráveis (padrão: 25 minutos)
- Pausas curtas (padrão: 5 minutos)
- Pausas longas (padrão: 15 minutos)
- Sistema de ciclos automático
- Controles de play/pause/reset
- Visualização circular de progresso

### 📝 Gerenciamento de Tarefas
- Criar, editar e excluir tarefas
- Marcar tarefas como concluídas
- Associar tarefas a sessões Pomodoro
- Rastreamento de tempo por tarefa
- Desfazer exclusão de tarefas

### 📊 Estatísticas e Histórico
- Estatísticas diárias de produtividade
- Visão semanal de desempenho
- Histórico de sessões completas
- Tempo total de foco
- Número de pomodoros completados
- Duração média das sessões

### ⚙️ Configurações Personalizáveis
- Duração das sessões de trabalho
- Duração das pausas (curta e longa)
- Número de sessões antes da pausa longa
- Temas visuais
- Famílias de fontes
- Temas de som (suave, sino, silencioso)
- Controle de volume
- Opções de silenciar (trabalho/pausa)

### 🔔 Recursos Adicionais
- **PWA**: Instalável e funciona offline
- **Notificações**: Alertas do navegador
- **Wake Lock**: Mantém tela ativa durante sessões
- **Atalhos de Teclado**: Controle rápido via teclado
- **Persistência**: Dados salvos localmente
- **Responsivo**: Funciona em desktop e mobile

## 📁 Estrutura do Projeto

```
pomodoro-app/
├── docker/                          # Configurações Docker
│   └── nginx.conf                   # Configuração Nginx otimizada
├── public/                          # Assets estáticos
│   ├── manifest.webmanifest        # Manifesto PWA
│   ├── favicon.ico
│   └── icons/                      # Ícones PWA (múltiplos tamanhos)
├── src/
│   ├── app/
│   │   ├── core/                   # Núcleo da aplicação
│   │   │   ├── models/            # Modelos de dados TypeScript
│   │   │   └── services/          # Serviços injetáveis
│   │   ├── features/              # Componentes de funcionalidades
│   │   │   ├── timer/
│   │   │   ├── tasks/
│   │   │   ├── statistics/
│   │   │   └── settings/
│   │   ├── app.config.ts          # Configuração da aplicação
│   │   ├── app.routes.ts          # Definição de rotas
│   │   └── app.ts                 # Componente raiz
│   ├── index.html                  # HTML principal
│   ├── main.ts                     # Entry point da aplicação
│   └── styles.scss                 # Estilos globais
├── angular.json                     # Configuração Angular CLI
├── docker-compose.yml              # Orquestração Docker
├── Dockerfile                       # Multi-stage build
├── ngsw-config.json                # Configuração Service Worker
├── package.json                     # Dependências NPM
└── tsconfig.json                    # Configuração TypeScript
```

## 🚀 Como Começar

### Pré-requisitos

- **Node.js 22+** e npm
- **Docker** e **Docker Compose** (para execução containerizada)
- Navegador moderno com suporte a Service Workers

### Instalação Local

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd pomodoro-app
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute em modo desenvolvimento**
```bash
npm start
```

A aplicação estará disponível em `http://localhost:4200`

### Execução com Docker

#### Opção 1: Docker Compose (Recomendado)

```bash
docker-compose up -d
```

A aplicação estará disponível em `http://localhost:8080`

#### Opção 2: Docker Manual

```bash
# Build da imagem
docker build -t pomodoro-timer:latest .

# Executar container
docker run -d -p 8080:8080 --name pomodoro-timer pomodoro-timer:latest
```

### Build de Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/pomodoro-app/browser/`

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm start          # Servidor de desenvolvimento
npm run build      # Build de produção
npm run watch      # Build com watch mode
npm test           # Executar testes unitários
```

### Testes

O projeto utiliza **Jasmine** e **Karma** para testes unitários:

```bash
npm test
```

Arquivos de teste incluídos:
- `storage.service.spec.ts` - Testes do serviço de armazenamento
- `task.service.spec.ts` - Testes do gerenciamento de tarefas
- `timer.service.spec.ts` - Testes do timer Pomodoro
- `timer.component.spec.ts` - Testes do componente de timer

## 📐 Padrões de Código

### Convenções TypeScript
- **Strict mode** habilitado
- Uso de tipos explícitos
- Interfaces para contratos de dados
- Readonly para imutabilidade quando possível

### Convenções Angular
- **Standalone Components** (sem NgModules)
- **Signals** para gerenciamento de estado
- **Computed signals** para valores derivados
- **Effects** para side effects
- Injeção de dependências via `inject()`
- Services com `providedIn: 'root'`

### Formatação (Prettier)
```json
{
  "printWidth": 100,
  "singleQuote": true
}
```

### Estrutura de Componentes
```typescript
@Component({
  selector: 'app-nome',
  standalone: true,
  imports: [CommonModule, ...],
  templateUrl: './nome.component.html',
  styleUrls: ['./nome.component.scss']
})
export class NomeComponent {
  // Injeções
  private service = inject(ServiceName);

  // Signals e computed
  readonly state = signal<Type>(initialValue);
  readonly computed = computed(() => ...);

  // Métodos públicos
  publicMethod(): void { }

  // Métodos privados
  private privateMethod(): void { }
}
```

### Nomenclatura
- **Arquivos**: kebab-case (`timer.service.ts`)
- **Classes**: PascalCase (`TimerService`)
- **Variáveis/Métodos**: camelCase (`startTimer()`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_SETTINGS`)
- **Interfaces**: PascalCase (`PomodoroSettings`)

## 🐳 Docker

### Multi-stage Dockerfile

O projeto utiliza um **Dockerfile multi-stage** para otimização:

**Stage 1 - Builder**:
- Base: `node:22-slim`
- Instalação de dependências com `npm ci`
- Build de produção otimizado

**Stage 2 - Runtime**:
- Base: `nginx:1.27-bookworm`
- Cópia dos arquivos buildados
- Configuração Nginx customizada
- Health check configurado
- Porta: 8080

### Recursos do Container

Limites configurados no `docker-compose.yml`:
```yaml
resources:
  limits:
    cpus: "0.5"
    memory: 256M
  reservations:
    cpus: "0.25"
    memory: 128M
```

### Segurança
- `no-new-privileges:true` - Previne escalonamento de privilégios
- Server tokens desabilitados no Nginx
- Healthcheck para monitoramento

### Otimizações Nginx
- Compressão Gzip habilitada
- Cache de assets estáticos
- Fallback para SPA (Single Page Application)
- Service Worker friendly

## 🔄 Fluxo de Trabalho

### Ciclo de Desenvolvimento
1. Desenvolvimento local com hot-reload (`npm start`)
2. Testes unitários (`npm test`)
3. Build de produção (`npm run build`)
4. Teste em container Docker
5. Deploy

### Gerenciamento de Estado
- **Signals** centralizam o estado
- **LocalStorage** para persistência
- **Effects** sincronizam mudanças
- **Computed** derivam valores automaticamente

### PWA e Offline
- Service Worker registrado automaticamente
- Assets em cache para uso offline
- Estratégia de cache configurável
- Atualizações automáticas

## 🎓 Objetivos de Aprendizado

Este projeto foi desenvolvido para estudar e praticar:

### Angular 20 (Latest Features)
- [x] **Standalone Components** - Nova arquitetura sem NgModules
- [x] **Signals** - Sistema de reatividade granular
- [x] **Computed & Effects** - Programação reativa declarativa
- [x] **inject()** - Injeção de dependências moderna
- [x] **Service Workers** - PWA e funcionalidade offline
- [x] **Router** - Navegação e lazy loading
- [x] **Forms Reactivos** - Validação e controle de formulários
- [x] **RxJS** - Observables e programação assíncrona

### Docker & Containerização
- [x] **Multi-stage builds** - Otimização de imagens
- [x] **Docker Compose** - Orquestração de serviços
- [x] **Nginx** - Configuração de servidor web
- [x] **Health checks** - Monitoramento de containers
- [x] **Resource limits** - Gerenciamento de recursos
- [x] **Security best practices** - Hardening de containers

### Boas Práticas de Desenvolvimento
- [x] **Clean Architecture** - Separação de responsabilidades
- [x] **SOLID Principles** - Design patterns
- [x] **Testing** - Testes unitários com Jasmine/Karma
- [x] **TypeScript** - Tipagem forte e segurança
- [x] **Code formatting** - Prettier para consistência
- [x] **Git workflow** - Controle de versão

## 🤝 Contribuindo

Este é um projeto de estudo, mas contribuições são bem-vindas!

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade incrível'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes
- Siga os padrões de código estabelecidos
- Adicione testes para novas funcionalidades
- Mantenha a documentação atualizada
- Use commits semânticos (Add:, Fix:, Update:, etc.)

## 📄 Licença

Este projeto é de código aberto e está disponível para fins educacionais.

---

## 📚 Recursos Úteis

### Documentação Angular
- [Angular Official Docs](https://angular.dev)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Service Workers & PWA](https://angular.dev/ecosystem/service-workers)
- [Standalone Components](https://angular.dev/guide/components/importing)

### Técnica Pomodoro
- [Pomodoro Technique®](https://francescocirillo.com/pages/pomodoro-technique)

### Docker
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Docker](https://hub.docker.com/_/nginx)

---

<div align="center">

**Desenvolvido com ❤️ para aprendizado de Angular e Docker**

</div>
