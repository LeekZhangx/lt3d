/**
 * 方块贴图模板
 * 
 * 规范不同类别方块的贴图排布
 * 
 * 源自MC 1.12 assets\minecraft\models\block\ 
 * 有删改
 */
export const BLOCK_TYPE_TABLE_1_12 = {

  "cube":{
    "parent": "block/block",
    "elements": [
        { 
          "faces": {
              "down":  { "texture": "#down", "cullface": "down" },
              "up":    { "texture": "#up", "cullface": "up" },
              "north": { "texture": "#north", "cullface": "north" },
              "south": { "texture": "#south", "cullface": "south" },
              "west":  { "texture": "#west", "cullface": "west" },
              "east":  { "texture": "#east", "cullface": "east" }
          }
        }
    ]
  },

  "cube_all":{
    "parent": "block/cube",
    "textures": {
        "particle": "#all",
        "down": "#all",
        "up": "#all",
        "north": "#all",
        "east": "#all",
        "south": "#all",
        "west": "#all"
    }
  },

  "cube_bottom_top":{
    "parent": "block/cube",
    "textures": {
        "particle": "#side",
        "down": "#bottom",
        "up": "#top",
        "north": "#side",
        "east": "#side",
        "south": "#side",
        "west": "#side"
    }
  },

  "cube_column":{
    "parent": "block/cube",
    "textures": {
        "particle": "#side",
        "down": "#end",
        "up": "#end",
        "north": "#side",
        "east": "#side",
        "south": "#side",
        "west": "#side"
    }
  },

  "cube_directional":{
    "parent": "block/block",
    "elements": [
        {
          "faces": {
              "down":  { "texture": "#down", "cullface": "down", "rotation":  180 },
              "up":    { "texture": "#up", "cullface": "up" },
              "north": { "texture": "#north", "cullface": "north" },
              "south": { "texture": "#south", "cullface": "south" },
              "west":  { "texture": "#west", "cullface": "west", "rotation":  270 },
              "east":  { "texture": "#east", "cullface": "east", "rotation":  90 }
          }
        }
    ]
  },

  "oriendtable": {
    "parent": "block/cube",
    "textures": {
        "particle": "#front",
        "down": "#top",
        "up": "#top",
        "north": "#front",
        "east": "#side",
        "south": "#side",
        "west": "#side"
    }
  },

  "orientable_vertical":{
    "parent": "block/cube",
    "textures": {
        "particle": "#side",
        "down": "#side",
        "up": "#front",
        "north": "#side",
        "east": "#side",
        "south": "#side",
        "west": "#side"
    }
  },

  "glazed_terracotta": {
    "parent": "block/cube",
    "elements":[{
      "faces": {
        "up":    { "texture": "#pattern", "rotation": 0   },
        "down":  { "texture": "#pattern", "rotation": 0 },
        "north": { "texture": "#pattern", "rotation": 90  },
        "south": { "texture": "#pattern", "rotation": 270 },
        "west":  { "texture": "#pattern", "rotation": 0 },
        "east":  { "texture": "#pattern", "rotation": 180  }
      }
    }]
  }
}