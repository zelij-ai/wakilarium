# wakilarium

Watch your agents work. A local collector, a Claude Code hook and a dependency-free web component that stage any AI agent, live and in replay, in the open Wakil Event format.

```bash
npx wakilarium                 # starts the collector on 127.0.0.1:8798 and opens the page
npx wakilarium install-hooks   # sends your Claude Code sessions to it (asks for consent, reversible)
```

Other agents: OpenTelemetry GenAI / OpenInference traces on `POST /v1/traces` (`OTEL_EXPORTER_OTLP_PROTOCOL=http/json`), AG-UI
streams on `POST /agui` or `curl -N … | npx wakilarium agui`, raw Wakil Events on `POST /events`.

Node 18 or later, zero dependencies, Apache-2.0. Documentation, event format and demo: https://github.com/zelij-ai/wakilarium
