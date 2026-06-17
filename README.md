# Company Score Lookup — Slack App

Search 250M+ company records directly from Slack.

## Commands

```
/company Ferrero         → Search by name
/company IT02727330014   → Search by VAT number
/company pizza IT        → Search with country filter
```

## Setup

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Import `manifest.json` or manually configure the slash command
3. Set the Request URL to your server endpoint
4. Install to your workspace

## Self-hosting

```bash
npm start
# Listens on PORT (default: 3006)
```

Or with Docker:

```bash
docker build -t score-slack .
docker run -p 3006:3006 score-slack
```

## Data

- 250M+ companies, 50+ countries
- Revenue, employees, credit score, NACE, legal form, VAT, contacts
- Powered by [Score API](https://score.get-scala.com)

## License

MIT
