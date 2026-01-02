# Credit Card Perks Tracker

A web application to track and manage credit card perks with configurable reset cadences. Keep track of your credit card benefits and ensure you never miss out on valuable perks!

## Features

- **Credit Card Management**: Add and manage multiple credit cards with custom colors
- **Perk Tracking**: Create perks with configurable usage limits and reset cadences
- **Monthly Checklist**: View active perks for any month with usage tracking
- **Flexible Reset Cadences**: Support for monthly, quarterly, semi-annually, and annually resetting perks
- **Data Export/Import**: Backup and restore your data as JSON files
- **Google Drive Sync**: Optional automatic cloud sync across devices
- **Local Storage**: All data is stored locally in your browser
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. Open `index.html` in your web browser
2. Start by adding your credit cards in the "Manage Cards" tab
3. Add perks to your cards in the "Manage Perks" tab
4. Track your monthly perk usage in the "Monthly Checklist" tab

## Usage

### Adding a Credit Card

1. Go to the "Manage Cards" tab
2. Click the "+ Add Card" button
3. Enter the card name, issuer (optional), and choose a color
4. Click "Save Card"

### Adding a Perk

1. Go to the "Manage Perks" tab
2. Click the "+ Add Perk" button
3. Select the credit card
4. Enter the perk name and description (optional)
5. Set the usage limit per period (e.g., 1 for single-use perks)
6. Choose the reset cadence:
   - **Monthly**: Resets on the 1st of each month
   - **Quarterly**: Resets on Jan 1, Apr 1, Jul 1, Oct 1
   - **Semi-Annually**: Resets on Jan 1, Jul 1
   - **Annually**: Resets on Jan 1
7. Click "Save Perk"

### Tracking Perk Usage

1. Go to the "Monthly Checklist" tab
2. Navigate to the desired month using the arrow buttons
3. Check off perks as you use them
4. The usage counter shows how many times you've used each perk

## Reset Cadence Details

Perks appear in the monthly checklist throughout their entire reset period and disappear once redeemed:

- **Monthly perks**: Show every month (resets monthly)
- **Quarterly perks**: Show in all 3 months of the quarter until redeemed
  - Q1: January, February, March
  - Q2: April, May, June
  - Q3: July, August, September
  - Q4: October, November, December
- **Semi-annual perks**: Show in all 6 months of the half until redeemed
  - H1: January through June
  - H2: July through December
- **Annual perks**: Show in all 12 months until redeemed

Usage tracking is period-based, so once you check off a quarterly perk in February, it stays checked for the entire quarter (Feb and March), then resets in April for the next quarter.

## Examples of Credit Card Perks

- $300 Annual Travel Credit (Annual reset)
- Airport Lounge Access - 4 visits (Quarterly reset)
- $50 Statement Credit (Monthly reset)
- Free Hotel Night (Annual reset)
- Dining Credits (Monthly reset)

## Data Management & Backup

### Local Storage

All data is stored locally in your browser's localStorage by default. Your information stays on your device for privacy and offline access.

### Export/Import

**Export Data:**
1. Go to the "Data & Sync" tab
2. Click "Export Data"
3. Save the JSON file to your computer
4. Store it in iCloud Drive, Google Drive, Dropbox, or any cloud storage

**Import Data:**
1. Go to the "Data & Sync" tab
2. Click "Import Data"
3. Select your backup JSON file
4. Confirm to restore your data

This manual backup method works with any cloud storage service and gives you full control over your data.

### Google Drive Sync (Optional)

For automatic cloud sync across devices, you can enable Google Drive integration.

**Setup Google Drive Sync:**

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Drive API

2. **Get API Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Create an OAuth 2.0 Client ID (Web application type)
   - Add your domain to authorized JavaScript origins
   - Create an API Key

3. **Configure the App:**
   - Edit `app.js` (around line 622-623)
   - Set `CLIENT_ID` to your OAuth 2.0 Client ID
   - Set `API_KEY` to your API Key

4. **Use Google Drive:**
   - Go to "Data & Sync" tab
   - Click "Connect Google Drive"
   - Authorize the app
   - Use "Save to Drive" and "Load from Drive" buttons
   - Enable "Auto-sync" for automatic backups on changes

**Note:** Google Drive sync is optional and requires technical setup. The export/import feature works immediately without any configuration.

## Browser Compatibility

Works with all modern browsers that support:
- localStorage
- ES6+ JavaScript
- CSS Grid and Flexbox

## Technical Stack

- Pure HTML5, CSS3, and JavaScript (ES6+)
- No external dependencies
- Local storage for data persistence
- Responsive design with CSS Grid and Flexbox
