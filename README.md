# kitchensink

A Foundry VTT system built with ISDL

[![Foundry VTT](https://img.shields.io/badge/Foundry-v12-informational?logo=foundryvirtualtabletop)](https://foundryvtt.com/)
[![License](https://img.shields.io/github/license/cswendrowski/kitchensink)](LICENSE)
[![Latest Release](https://img.shields.io/github/release/cswendrowski/kitchensink)](https://github.com/cswendrowski/kitchensink/releases)

## 🎲 About

This is a **Foundry Virtual Tabletop** system built using **ISDL** (Intelligent System Design Language). ISDL allows for rapid development of complex tabletop RPG systems with modern, reactive character sheets and comprehensive game mechanics.

## 📦 Installation

### Automatic Installation (Recommended)
1. Open Foundry VTT
2. Go to the **"Game Systems"** tab
3. Click **"Install System"**
4. Enter this manifest URL:
   ```
   https://raw.githubusercontent.com/cswendrowski/kitchensink/releases/latest/system.json
   ```
5. Click **"Install"**

### Manual Installation
1. Download the latest release from [Releases](https://github.com/cswendrowski/kitchensink/releases)
2. Extract the contents to your Foundry `Data/systems/kitchensink` folder
3. Restart Foundry VTT

## 🚀 Features

- **🎨 Modern UI**: Responsive Vue.js components with Vuetify Material Design
- **⚡ Reactive Sheets**: Real-time updates and smooth interactions
- **🔧 Highly Configurable**: Extensive customization options for different playstyles
- **📱 Mobile Friendly**: Optimized for both desktop and tablet play
- **🎯 Dice Integration**: Advanced dice rolling with custom formulas
- **👥 Actor Management**: Comprehensive character, NPC, and creature support
- **📋 Item System**: Flexible items with custom properties and actions
- **🎭 Active Effects**: Dynamic character modifications and status tracking
- **🎪 Automation**: Built-in automation for common tasks and calculations

## 🛠️ Development

This system was created using the ISDL VS Code extension. To modify or contribute:

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [ISDL Extension](https://marketplace.visualstudio.com/items?itemName=IronMooseDevelopment.fsdl)
- [Node.js](https://nodejs.org/) (v18+)
- [Foundry VTT](https://foundryvtt.com/) (v11+)

### Setup
```bash
# Clone the repository
git clone https://github.com/cswendrowski/kitchensink.git
cd kitchensink

# Install dependencies (if any)
npm install

# Open in VS Code
code .
```

### Making Changes
1. Open the `.isdl` files in VS Code
2. Make your modifications using ISDL syntax
3. Run **"ISDL: Generate System"** command (`Ctrl+Shift+P`)
4. Test changes in Foundry VTT
5. Create a pull request with your improvements


## 📁 Project Structure

```
kitchensink/
├── system.json          # System manifest
├── template.json        # Data templates
├── *.isdl              # Source ISDL files
├── scripts/            # Generated JavaScript
├── styles/             # Generated CSS
├── templates/          # Handlebars templates
├── lang/              # Localization files
└── assets/            # Images and media
```


## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🐛 Report Bugs**: Use the [issue tracker](https://github.com/cswendrowski/kitchensink/issues)
2. **💡 Suggest Features**: Share your ideas for improvements
3. **📝 Improve Documentation**: Help make our docs clearer
4. **🔧 Submit Code**: Fork, modify, and create pull requests
5. **🌍 Translate**: Help localize the system

### Development Guidelines
- Follow ISDL best practices
- Test thoroughly before submitting
- Update documentation as needed
- Use descriptive commit messages

## 📜 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🆘 Support

### Getting Help
- **📖 Documentation**: Check the [Wiki](https://github.com/cswendrowski/kitchensink/wiki)
- **💬 Community**: Join our [Discord](https://discord.gg/foundryvtt)
- **🐛 Issues**: Report bugs on [GitHub Issues](https://github.com/cswendrowski/kitchensink/issues)
- **❓ Questions**: Use [GitHub Discussions](https://github.com/cswendrowski/kitchensink/discussions)

---

**Built with ❤️ using [ISDL](https://marketplace.visualstudio.com/items?itemName=IronMooseDevelopment.fsdl)**

*Ready to create your own ISDL system? [Get started here!](https://github.com/IronMooseDevelopment/isdl-docs)*
