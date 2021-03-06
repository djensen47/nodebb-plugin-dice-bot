# nodebb-plugin-dice-bot

NodeBB plugin for rolling dice via a bot.

## Setup
1. Install and enable plugin
1. Create a new user on your system for the dice bot. Give it any name you please and change the avatar to anything you like.
1. Go to the ACP and find the settings for Dice Bot.
1. Enter the ID of the user you created in the provided field.

## Usage

Anywhere in a post type something like the following:

```
[dice 1d6]
```

or with a modifier, which also returns a sum

```
[dice 1d6+2]
[dice 1d6+0]
```

or with less than or greater than it counts the number of hits for the rolls (not with modifiers)

```
[dice 10d6<=3]
[dice 10d6<3]
[dice 10d6>=3]
[dice 10d6>3]
```

You can also roll mulitple types of dice

```
[dice 1d4 2d6 3d8 4d10]
```

