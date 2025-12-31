# Credit Card Perks Tracker

A web application to track and manage credit card perks with configurable reset cadences. Keep track of your credit card benefits and ensure you never miss out on valuable perks!

## Features

- **Credit Card Management**: Add and manage multiple credit cards with custom colors
- **Perk Tracking**: Create perks with configurable usage limits and reset cadences
- **Monthly Checklist**: View active perks for any month with usage tracking
- **Flexible Reset Cadences**: Support for monthly, quarterly, semi-annually, and annually resetting perks
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

Perks are displayed in the monthly checklist based on their reset cadence:

- **Monthly perks**: Show every month
- **Quarterly perks**: Show only in January, April, July, and October
- **Semi-annual perks**: Show only in January and July
- **Annual perks**: Show only in January

Usage counts are tracked per month, allowing you to see your perk utilization over time.

## Examples of Credit Card Perks

- $300 Annual Travel Credit (Annual reset)
- Airport Lounge Access - 4 visits (Quarterly reset)
- $50 Statement Credit (Monthly reset)
- Free Hotel Night (Annual reset)
- Dining Credits (Monthly reset)

## Data Storage

All data is stored locally in your browser's localStorage. Your information never leaves your device. To backup your data, you can export the localStorage data using browser developer tools.

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
