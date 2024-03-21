import tkinter
import tkinter.messagebox
import customtkinter

customtkinter.set_appearance_mode("System")  # Modes: "System" (standard), "Dark", "Light"
customtkinter.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

class App(customtkinter.CTk):
    def __init__(self):
        super().__init__()

        # configure window
        self.title("CustomTkinter complex_example.py")
        self.geometry(f"{1100}x{580}")

        #self.intUserInput = None
        #self.test = False
        #while not self.test:
        #    self.intUserInput = customtkinter.CTkInputDialog(text="Enter the number of players beetween 3 and 5", title="CTkInputDialog")
        #    self.intUserInput = int(self.intUserInput.get_input())
        #    if self.intUserInput > 6 or self.intUserInput < 3:
        #        self.test = False
        #    else:
        #        self.test = True
        #print(self.intUserInput)

        # configure grid layout (4x4)
        #self.grid_columnconfigure(1, weight=1)
        #self.grid_columnconfigure((2, 3), weight=0)
        #self.grid_rowconfigure((0, 1, 2), weight=1)

        # create sidebar frame with widgets
        self.sidebar_frame = customtkinter.CTkFrame(self, width=50, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        #self.sidebar_frame.grid_rowconfigure(4, weight=1)
        #self.logo_label = customtkinter.CTkLabel(self.sidebar_frame, text="CustomTkinter",
                                                 #font=customtkinter.CTkFont(size=20, weight="bold"))
        #self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        self.appearance_mode_label = customtkinter.CTkLabel(self.sidebar_frame, text="Appearance Mode:", anchor="w")
        self.appearance_mode_label.grid(row=5, column=0, padx=20, pady=(10, 0))
        self.appearance_mode_optionemenu = customtkinter.CTkOptionMenu(self.sidebar_frame, values=["Light", "Dark", "System"],
                                                                       command=self.change_appearance_mode_event)
        self.appearance_mode_optionemenu.grid(row=6, column=0, padx=20, pady=(10, 10))
        self.scaling_label = customtkinter.CTkLabel(self.sidebar_frame, text="UI Scaling:", anchor="w")
        self.scaling_label.grid(row=7, column=0, padx=20, pady=(10, 0))
        self.scaling_optionemenu = customtkinter.CTkOptionMenu(self.sidebar_frame, values=["80%", "90%", "100%", "110%", "120%"],
                                                               command=self.change_scaling_event)
        self.scaling_optionemenu.grid(row=8, column=0, padx=20, pady=(10, 20))
        self.legend_label1 = customtkinter.CTkLabel(self.sidebar_frame, text="pred = prediction", anchor="w")
        self.legend_label1.grid(row=9, column=0, padx=20, pady=(10, 0))
        self.legend_label2 = customtkinter.CTkLabel(self.sidebar_frame, text="act = actually", anchor="w")
        self.legend_label2.grid(row=10, column=0, padx=20, pady=(10, 0))

        # create main entry and button
        self.first_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.first_player_frame.grid(row=0, column=1, sticky="nsew")
        self.first_player = customtkinter.CTkEntry(self.first_player_frame, placeholder_text="first player")
        self.first_player.grid(row=0, column=0, columnspan=3, padx=(20, 0), pady=(20, 20))

        self.first_round_label = customtkinter.CTkLabel(self.first_player_frame, text="1 Round:", anchor="w")
        self.first_round_label.grid(row=1, column=0, padx=(0, 3), pady=(0, 0))
        self.first_round_points = customtkinter.CTkLabel(self.first_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.first_round_points.grid(row=1, column=1, sticky="nsew")
        self.first_round_pred = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="pred")
        self.first_round_pred.grid(row=1, column=2, sticky="nsew")
        self.first_round_act = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="act")
        self.first_round_act.grid(row=1, column=3, sticky="nsew")
        self.first_round_pred.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points, self.first_round_pred.get(), self.first_round_act.get()))
        self.first_round_act.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points, self.first_round_pred.get(), self.first_round_act.get()))

        # second player
        self.second_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.second_player_frame.grid(row=0, column=2, sticky="nsew")
        self.second_player = customtkinter.CTkEntry(self.second_player_frame, placeholder_text="second player")
        self.second_player.grid(row=0, column=0, columnspan=3, padx=(20, 0), pady=(20, 20))

        self.first_round_points_p2 = customtkinter.CTkLabel(self.second_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.first_round_points_p2.grid(row=1, column=1, sticky="nsew")
        self.first_round_pred_p2 = customtkinter.CTkEntry(self.second_player_frame, width=55, placeholder_text="pred")
        self.first_round_pred_p2.grid(row=1, column=2, sticky="nsew")
        self.first_round_act_p2 = customtkinter.CTkEntry(self.second_player_frame, width=55, placeholder_text="act")
        self.first_round_act_p2.grid(row=1, column=3, sticky="nsew")
        self.first_round_pred_p2.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p2, self.first_round_pred_p2.get(), self.first_round_act_p2.get()))
        self.first_round_act_p2.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p2, self.first_round_pred_p2.get(), self.first_round_act_p2.get()))



        # set default values
        self.appearance_mode_optionemenu.set("Dark")
        self.scaling_optionemenu.set("100%")


    def change_appearance_mode_event(self, new_appearance_mode: str):
        customtkinter.set_appearance_mode(new_appearance_mode)

    def change_scaling_event(self, new_scaling: str):
        new_scaling_float = int(new_scaling.replace("%", "")) / 100
        customtkinter.set_widget_scaling(new_scaling_float)

    def update_label(self, event, label_point_before,label_point_after, entry_widget_pred, entry_widget_act):
        global int_pred
        global int_act
        global int_label
        try:
            int_pred = int(entry_widget_pred)
            int_act = int(entry_widget_act)
        except ValueError:
            print("Der String ist keine gültige Ganzzahl.")
            return None
        try:
            int_label = int(label_point_before.cget("text"))
        except:
            int_label = 0
        if (int_pred or int_act) is None:
            print("None")
            pass
        elif isinstance(int_pred, str) or isinstance(int_act, str):
            print("String")
            pass
        else:
            dif = abs(int(int_pred) - int(int_act))
            if dif == 0:
                new_points = int_label + (int_pred*10) + 20
                label_point_after.configure(text=new_points)
            else:
                new_points = int_label - (dif*10)
                label_point_after.configure(text=new_points)

if __name__ == "__main__":
    app = App()
    app.mainloop()