# HyaAdPoster

HyaAdPoster is a desktop application for automating trade ad posting on [Rolimons](https://www.rolimons.com).

Instead of manually reposting your trade ads every 15 minutes, you can configure your accounts and trades once and let HyaAdPoster handle the queue for you.

The application is built with Electron, React and Vite and runs locally on your computer.

## Features

- Automatic trade ad posting
- 15-minute posting interval
- Multiple Rolimons accounts
- Profiles for different trade setups
- Trade queue with automatic rotation
- Discord webhook notifications
- Live activity and error logs
- Log export
- Local account and cookie storage
- Desktop interface built with Electron

## Download

The latest version can be downloaded from the [Releases](https://github.com/HyaFranch/hyaadposter/releases) page.

For Windows, download the `.exe` installer and run it.

## How it works

HyaAdPoster uses profiles and trade queues to organize your advertisements.

After adding a Rolimons account, you create a profile and add the trades you want to advertise.

When the application is running, it processes the queue in order and posts each trade ad. After reaching the end of the queue, it starts again from the beginning.

The application waits between posts according to the posting cooldown.

Example:

```text
Trade 1
   |
   v
Wait 15 minutes
   |
   v
Trade 2
   |
   v
Wait 15 minutes
   |
   v
Trade 3
   |
   v
Wait 15 minutes
   |
   v
Trade 1
   |
   v
...
```

## Requirements

### For the compiled application

- Windows

### For development

- Node.js 18 or newer
- npm
- A Rolimons account
- A valid `_RoliVerification` cookie

## Installation

Download the latest `.exe` installer from the [Releases](https://github.com/HyaFranch/hyaadposter/releases) page.

Run the installer and follow the setup instructions.

## Development

Clone the repository:

```bash
git clone https://github.com/HyaFranch/hyaadposter.git
cd hyaadposter
```

Install the dependencies:

```bash
npm install
```

Run the Vite development server:

```bash
npm run dev
```

To run the desktop application through Electron:

```bash
npm run electron:dev
```

## Building

To build the desktop application:

```bash
npm run electron:build
```

The generated files will be placed in:

```text
dist-electron/
```

## Getting your Rolimons cookie

HyaAdPoster uses the `_RoliVerification` cookie to make requests using your Rolimons session.

To get your cookie:

1. Open [Rolimons](https://www.rolimons.com) and log in.
2. Press `F12` to open Developer Tools.
3. Open the `Application` tab.
4. Go to `Cookies`.
5. Select `https://www.rolimons.com`.
6. Find the `_RoliVerification` cookie.
7. Copy its value.
8. Open HyaAdPoster.
9. Go to the **Accounts** section.
10. Add your account and paste the cookie.

Keep this cookie private.

Your `_RoliVerification` cookie is related to your Rolimons session and should never be shared with other people.

HyaAdPoster stores account information locally. The application does not send your cookie to an external service operated by HyaAdPoster.

## Usage

### 1. Add an account

Open the **Accounts** section and add your Rolimons account using your `_RoliVerification` cookie.

### 2. Create a profile

Create a profile for the trade setup you want to use.

For example:

```text
Main Account
├── Trade A
├── Trade B
└── Trade C
```

You can create multiple profiles if you want to keep different trade configurations separated.

### 3. Add trades

Open a profile and configure the trades you want to advertise.

The trades are added to a queue and processed in the order they were configured.

### 4. Start the application

Start the automation from the Dashboard.

HyaAdPoster will process the trade queue automatically and wait between posts according to the posting cooldown.

## Multiple Accounts

HyaAdPoster supports multiple Rolimons accounts.

Each account can have its own profiles and trade configurations, allowing you to keep everything separated.

## Discord Webhooks

You can optionally configure a Discord webhook from the **Settings** section.

HyaAdPoster can send notifications for events such as:

- Successful ad posts
- Failed posts
- Errors
- Cooldown-related events

This allows you to keep track of the application without constantly checking the dashboard.

## Logs

HyaAdPoster includes a live activity log that shows what the application is doing.

The logs can be used to check:

- Successful posts
- Failed posts
- Errors
- Cooldowns
- Account activity
- Other application events

Logs can also be exported for later use.

## Project Structure

```text
HyaAdPoster/
├── electron/
│   ├── main.js
│   └── preload.js
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   └── styles/
├── index.html
├── vite.config.js
└── package.json
```

## Tech Stack

- Electron
- React
- Vite
- JavaScript
- Rolimons API

## Disclaimer

HyaAdPoster is an independent third-party application and is not affiliated with, maintained by, or endorsed by Rolimons.

Rolimons may change its website, API, authentication system, cooldowns or other functionality at any time. These changes may cause parts of HyaAdPoster to stop working until the application is updated.

Use the application responsibly and make sure you follow the rules of the services you use.

Never share your `_RoliVerification` cookie with anyone.

## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for more information.
