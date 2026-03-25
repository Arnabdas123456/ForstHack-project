def get_visual_theme(mood):

    themes = {

        "chill": {
            "overlay": "rain",
            "zoom_speed": 0.01,
            "color_filter": "cool"
        },

        "lofi": {
            "overlay": "particle",
            "zoom_speed": 0.012,
            "color_filter": "purple"
        },

        "sleep": {
            "overlay": "snow",
            "zoom_speed": 0.005,
            "color_filter": "cold"
        },

        "relax": {
            "overlay": "fog",
            "zoom_speed": 0.015,
            "color_filter": "warm"
        },

        "happy": {
            "overlay": "particle",
            "zoom_speed": 0.02,
            "color_filter": "bright"
        },

        "sad": {
            "overlay": "rain",
            "zoom_speed": 0.008,
            "color_filter": "dark"
        },

        "romantic": {
            "overlay": "fog",
            "zoom_speed": 0.012,
            "color_filter": "pink"
        },

        "party": {
            "overlay": "neon",
            "zoom_speed": 0.04,
            "color_filter": "vivid"
        },

        "cyberpunk": {
            "overlay": "neon",
            "zoom_speed": 0.04,
            "color_filter": "vivid"
        },

        "space": {
            "overlay": "star",
            "zoom_speed": 0.02,
            "color_filter": "galaxy"
        },

        "forest": {
            "overlay": "particle",
            "zoom_speed": 0.012,
            "color_filter": "green"
        },

        "beach": {
            "overlay": "particle",
            "zoom_speed": 0.02,
            "color_filter": "aqua"
        },

        "night_city": {
            "overlay": "neon",
            "zoom_speed": 0.015,
            "color_filter": "deep_blue"
        }
    }

    return themes.get(mood, themes["chill"])