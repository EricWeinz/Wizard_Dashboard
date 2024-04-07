import customtkinter

customtkinter.set_appearance_mode("System")  # Modes: "System" (standard), "Dark", "Light"
customtkinter.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"
class App(customtkinter.CTk):
    def __init__(self):
        super().__init__()

        self.intUserInput = None
        self.test = False
        while not self.test:
            self.intUserInput = customtkinter.CTkInputDialog(text="Enter the number of players between 3 and 6", title="CTkInputDialog")
            self.intUserInput = int(self.intUserInput.get_input())
            if self.intUserInput > 6 or self.intUserInput < 3:
                self.test = False
            else:
                self.test = True

        global set_rows
        if self.intUserInput == 3:
            set_rows = 21
        elif self.intUserInput == 4:
            set_rows = 16
        elif self.intUserInput == 5:
            set_rows = 13
        else:
            set_rows = 11


        self.title("CustomTkinter complex_example.py")
        self.geometry(f"{1350}x{800}")

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
        self.legend_label1 = customtkinter.CTkLabel(self.sidebar_frame, text="pred = prediction", anchor="w", font=customtkinter.CTkFont(size=20, weight="bold"))
        self.legend_label1.grid(row=5, column=0, padx=0, pady=(10, 0))
        self.legend_label2 = customtkinter.CTkLabel(self.sidebar_frame, text="act = actually", anchor="w", font=customtkinter.CTkFont(size=20, weight="bold"))
        self.legend_label2.grid(row=6, column=0, padx=0, pady=(10, 0))

        self.space = customtkinter.CTkLabel(self.sidebar_frame, text="", anchor="w", font=customtkinter.CTkFont(size=5, weight="bold"))
        self.space.grid(row=7, column=0, padx=20, pady=(10, 0))

        self.name_p1 = customtkinter.CTkLabel(self.sidebar_frame, text="first player:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
        self.name_p1.grid(row=9, column=0, padx=0, pady=(10, 0))
        self.pred_p1 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
        self.pred_p1.grid(row=10, column=0, padx=0, pady=(10, 0))
        self.points_p1 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="green")
        self.points_p1.grid(row=10, column=1, padx=5, pady=(10, 0))
        self.name_p2 = customtkinter.CTkLabel(self.sidebar_frame, text="second player:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
        self.name_p2.grid(row=11, column=0, padx=0, pady=(10, 0))
        self.pred_p2 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
        self.pred_p2.grid(row=12, column=0, padx=0, pady=(10, 0))
        self.points_p2 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="green")
        self.points_p2.grid(row=12, column=1, padx=5, pady=(10, 0))
        self.name_p3 = customtkinter.CTkLabel(self.sidebar_frame, text="third player:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
        self.name_p3.grid(row=13, column=0, padx=0, pady=(10, 0))
        self.pred_p3 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
        self.pred_p3.grid(row=14, column=0, padx=0, pady=(10, 0))
        self.points_p3 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="green")
        self.points_p3.grid(row=14, column=1, padx=5, pady=(10, 0))

        if self.intUserInput > 3:
            self.name_p4 = customtkinter.CTkLabel(self.sidebar_frame, text="fourth player prediction:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
            self.name_p4.grid(row=15, column=0, padx=20, pady=(10, 0))
            self.pred_p4 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
            self.pred_p4.grid(row=16, column=0, padx=20, pady=(10, 0))
            self.points_p4 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w",
                                                    font=customtkinter.CTkFont(size=18, weight="bold"),
                                                    text_color="green")
            self.points_p4.grid(row=16, column=1, padx=5, pady=(10, 0))
        if self.intUserInput > 4:
            self.name_p5 = customtkinter.CTkLabel(self.sidebar_frame, text="fifth player prediction:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
            self.name_p5.grid(row=17, column=0, padx=20, pady=(10, 0))
            self.pred_p5 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
            self.pred_p5.grid(row=18, column=0, padx=20, pady=(10, 0))
            self.points_p5 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w",
                                                    font=customtkinter.CTkFont(size=18, weight="bold"),
                                                    text_color="green")
            self.points_p5.grid(row=18, column=1, padx=5, pady=(10, 0))
        if self.intUserInput > 5:
            self.name_p6 = customtkinter.CTkLabel(self.sidebar_frame, text="sixth player prediction:", anchor="w", font=customtkinter.CTkFont(size=15, weight="bold"))
            self.name_p6.grid(row=19, column=0, padx=20, pady=(10, 0))
            self.pred_p6 = customtkinter.CTkLabel(self.sidebar_frame, text="pred", anchor="w", font=customtkinter.CTkFont(size=18, weight="bold"), text_color="orange")
            self.pred_p6.grid(row=20, column=0, padx=20, pady=(10, 0))
            self.points_p6 = customtkinter.CTkLabel(self.sidebar_frame, text="points", anchor="w",
                                                    font=customtkinter.CTkFont(size=18, weight="bold"),
                                                    text_color="green")
            self.points_p6.grid(row=20, column=1, padx=5, pady=(10, 0))

        self.space = customtkinter.CTkLabel(self.sidebar_frame, text="", anchor="w", font=customtkinter.CTkFont(size=5, weight="bold"))
        self.space.grid(row=21, column=0, padx=20, pady=(10, 0))

        self.appearance_mode_label = customtkinter.CTkLabel(self.sidebar_frame, text="Appearance Mode:", anchor="w")
        self.appearance_mode_label.grid(row=22, column=0, padx=20, pady=(10, 0))
        self.appearance_mode_optionemenu = customtkinter.CTkOptionMenu(self.sidebar_frame, values=["Light", "Dark", "System"],
                                                                       command=self.change_appearance_mode_event)
        self.appearance_mode_optionemenu.grid(row=23, column=0, padx=20, pady=(10, 10))
        self.scaling_label = customtkinter.CTkLabel(self.sidebar_frame, text="UI Scaling:", anchor="w")
        self.scaling_label.grid(row=24, column=0, padx=20, pady=(10, 0))
        self.scaling_optionemenu = customtkinter.CTkOptionMenu(self.sidebar_frame, values=["80%", "90%", "100%", "110%", "120%"],
                                                               command=self.change_scaling_event)
        self.scaling_optionemenu.grid(row=25, column=0, padx=20, pady=(10, 20))

        """
        ###########################################
        first player
        ###########################################
        """
        self.first_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.first_player_frame.grid(row=0, column=1, sticky="nsew")
        self.first_player = customtkinter.CTkEntry(self.first_player_frame, placeholder_text="enter name", fg_color="#22548b")
        self.first_player.grid(row=0, column=1, columnspan=3, padx=(20, 0), pady=(20, 20))

        self.first_round_label = customtkinter.CTkLabel(self.first_player_frame, text="1 Round:", anchor="w")
        self.first_round_label.grid(row=1, column=0, padx=(0, 15), pady=(0, 0))
        self.first_round_points_p1 = customtkinter.CTkLabel(self.first_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.first_round_points_p1.grid(row=1, column=1)
        self.first_round_pred_p1 = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="pred")
        self.first_round_pred_p1.grid(row=1, column=2)
        self.first_round_act_p1 = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="act")
        self.first_round_act_p1.grid(row=1, column=3)
        self.first_round_pred_p1.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p1, self.first_round_pred_p1.get(), self.first_round_act_p1.get(), self.pred_p1, self.points_p1))
        self.first_round_act_p1.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p1, self.first_round_pred_p1.get(), self.first_round_act_p1.get(), self.pred_p1, self.points_p1))

        self.second_round_label = customtkinter.CTkLabel(self.first_player_frame, text="2 Round:", anchor="w")
        self.second_round_label.grid(row=2, column=0, padx=(0, 15), pady=(0, 0))
        self.second_round_points_p1 = customtkinter.CTkLabel(self.first_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.second_round_points_p1.grid(row=2, column=1, pady=(5, 5))
        self.second_round_pred_p1 = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="pred")
        self.second_round_pred_p1.grid(row=2, column=2, pady=(5, 5))
        self.second_round_act_p1 = customtkinter.CTkEntry(self.first_player_frame, width=55, placeholder_text="act")
        self.second_round_act_p1.grid(row=2, column=3, pady=(5, 5))
        self.second_round_pred_p1.bind("<KeyRelease>", lambda event: self.update_label(event, self.first_round_points_p1, self.second_round_points_p1, self.second_round_pred_p1.get(), self.second_round_act_p1.get(), self.pred_p1, self.points_p1))
        self.second_round_act_p1.bind("<KeyRelease>", lambda event: self.update_label(event, self.first_round_points_p1, self.second_round_points_p1, self.second_round_pred_p1.get(), self.second_round_act_p1.get(), self.pred_p1, self.points_p1))

        previous_points_label = self.second_round_points_p1

        for round_number in range(3, set_rows):
            round_label, round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_first_player(self.first_player_frame, round_number,
                                                                                                           previous_points_label, self.pred_p1, self.points_p1)
            previous_points_label = round_points_label

            setattr(self, f'round_label_R{round_number}', round_label)
            setattr(self, f'round_points_p1_R{round_number}', round_points_label)
            setattr(self, f'round_pred_p1_R{round_number}', round_pred_entry)
            setattr(self, f'round_act_p1_R{round_number}', round_act_entry)

        """
        ###########################################
        second player
        ###########################################
        """
        self.second_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.second_player_frame.grid(row=0, column=2, sticky="nsew")
        self.second_player = customtkinter.CTkEntry(self.second_player_frame, placeholder_text="enter name", fg_color="#22548b")
        self.second_player.grid(row=0, column=0, columnspan=4, padx=(10, 0), pady=(20, 20))

        self.first_round_points_p2 = customtkinter.CTkLabel(self.second_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.first_round_points_p2.grid(row=1, column=1, padx=(5, 0), pady=(0, 0))
        self.first_round_pred_p2 = customtkinter.CTkEntry(self.second_player_frame, width=55, placeholder_text="pred")
        self.first_round_pred_p2.grid(row=1, column=2, pady=(0, 5))
        self.first_round_act_p2 = customtkinter.CTkEntry(self.second_player_frame, width=55, placeholder_text="act")
        self.first_round_act_p2.grid(row=1, column=3, pady=(0, 5))
        self.first_round_pred_p2.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p2, self.first_round_pred_p2.get(), self.first_round_act_p2.get(), self.pred_p2, self.points_p2))
        self.first_round_act_p2.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p2, self.first_round_pred_p2.get(), self.first_round_act_p2.get(), self.pred_p2, self.points_p2))

        previous_points_label = self.first_round_points_p2

        for round_number in range(2, set_rows):
            round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_other_player(self.second_player_frame, round_number,
                                                                                                           previous_points_label, self.pred_p2, self.points_p2)
            previous_points_label = round_points_label

            setattr(self, f'round_points_p2_R{round_number}', round_points_label)
            setattr(self, f'round_pred_p2_R{round_number}', round_pred_entry)
            setattr(self, f'round_act_p2_R{round_number}', round_act_entry)

        """
        ###########################################
        third player
        ###########################################
        """
        self.third_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.third_player_frame.grid(row=0, column=3, sticky="nsew")
        self.third_player = customtkinter.CTkEntry(self.third_player_frame, placeholder_text="enter name", fg_color="#22548b")
        self.third_player.grid(row=0, column=0, columnspan=4, padx=(10, 0), pady=(20, 20))

        self.first_round_points_p3 = customtkinter.CTkLabel(self.third_player_frame, width=50, text="points", anchor="w", text_color="grey")
        self.first_round_points_p3.grid(row=1, column=1, padx=(5, 0), pady=(0, 0))
        self.first_round_pred_p3 = customtkinter.CTkEntry(self.third_player_frame, width=55, placeholder_text="pred")
        self.first_round_pred_p3.grid(row=1, column=2, pady=(0, 5))
        self.first_round_act_p3 = customtkinter.CTkEntry(self.third_player_frame, width=55, placeholder_text="act")
        self.first_round_act_p3.grid(row=1, column=3, pady=(0, 5))
        self.first_round_pred_p3.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p3, self.first_round_pred_p3.get(), self.first_round_act_p3.get(), self.pred_p3, self.points_p3))
        self.first_round_act_p3.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p3, self.first_round_pred_p3.get(), self.first_round_act_p3.get(), self.pred_p3, self.points_p3))

        previous_points_label = self.first_round_points_p3

        for round_number in range(2, set_rows):
            round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_other_player(self.third_player_frame, round_number,
                                                                                                           previous_points_label, self.pred_p3, self.points_p3)
            previous_points_label = round_points_label

            setattr(self, f'round_points_p3_R{round_number}', round_points_label)
            setattr(self, f'round_pred_p3_R{round_number}', round_pred_entry)
            setattr(self, f'round_act_p3_R{round_number}', round_act_entry)

        """
        ###########################################
        fourth player
        ###########################################
        """
        if self.intUserInput > 3:
            self.fourth_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
            self.fourth_player_frame.grid(row=0, column=4, sticky="nsew")
            self.fourth_player = customtkinter.CTkEntry(self.fourth_player_frame, placeholder_text="enter name", fg_color="#22548b")
            self.fourth_player.grid(row=0, column=0, columnspan=4, padx=(10, 0), pady=(20, 20))

            self.first_round_points_p4 = customtkinter.CTkLabel(self.fourth_player_frame, width=50, text="points", anchor="w", text_color="grey")
            self.first_round_points_p4.grid(row=1, column=1, padx=(5, 0), pady=(0, 0))
            self.first_round_pred_p4 = customtkinter.CTkEntry(self.fourth_player_frame, width=55, placeholder_text="pred")
            self.first_round_pred_p4.grid(row=1, column=2, pady=(0, 5))
            self.first_round_act_p4 = customtkinter.CTkEntry(self.fourth_player_frame, width=55, placeholder_text="act")
            self.first_round_act_p4.grid(row=1, column=3, pady=(0, 5))
            self.first_round_pred_p4.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p4, self.first_round_pred_p4.get(), self.first_round_act_p4.get(), self.pred_p4, self.points_p4))
            self.first_round_act_p4.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p4, self.first_round_pred_p4.get(), self.first_round_act_p4.get(), self.pred_p4, self.points_p4))

            previous_points_label = self.first_round_points_p4

            for round_number in range(2, set_rows):
                round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_other_player(self.fourth_player_frame, round_number,
                                                                                                               previous_points_label, self.pred_p4, self.points_p4)
                previous_points_label = round_points_label

                setattr(self, f'round_points_p4_R{round_number}', round_points_label)
                setattr(self, f'round_pred_p4_R{round_number}', round_pred_entry)
                setattr(self, f'round_act_p4_R{round_number}', round_act_entry)
        else:
            pass

        """
        ###########################################
        fifth player
        ###########################################
        """
        if self.intUserInput > 4:
            self.fifth_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
            self.fifth_player_frame.grid(row=0, column=5, sticky="nsew")
            self.fifth_player = customtkinter.CTkEntry(self.fifth_player_frame, placeholder_text="enter name", fg_color="#22548b")
            self.fifth_player.grid(row=0, column=0, columnspan=4, padx=(10, 0), pady=(20, 20))

            self.first_round_points_p5 = customtkinter.CTkLabel(self.fifth_player_frame, width=50, text="points", anchor="w", text_color="grey")
            self.first_round_points_p5.grid(row=1, column=1, padx=(5, 0), pady=(0, 0))
            self.first_round_pred_p5 = customtkinter.CTkEntry(self.fifth_player_frame, width=55, placeholder_text="pred")
            self.first_round_pred_p5.grid(row=1, column=2, pady=(0, 5))
            self.first_round_act_p5 = customtkinter.CTkEntry(self.fifth_player_frame, width=55, placeholder_text="act")
            self.first_round_act_p5.grid(row=1, column=3, pady=(0, 5))
            self.first_round_pred_p5.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p5, self.first_round_pred_p5.get(), self.first_round_act_p5.get(), self.pred_p5, self.points_p5))
            self.first_round_act_p5.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p5, self.first_round_pred_p5.get(), self.first_round_act_p5.get(), self.pred_p5, self.points_p5))

            previous_points_label = self.first_round_points_p5

            for round_number in range(2, set_rows):
                round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_other_player(self.fifth_player_frame, round_number,
                                                                                                               previous_points_label, self.pred_p5, self.points_p5)
                previous_points_label = round_points_label

                setattr(self, f'round_points_p5_R{round_number}', round_points_label)
                setattr(self, f'round_pred_p5_R{round_number}', round_pred_entry)
                setattr(self, f'round_act_p5_R{round_number}', round_act_entry)
        else:
            pass

        """
        ###########################################
        sixth player
        ###########################################
        """
        if self.intUserInput > 5:
            self.sixth_player_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
            self.sixth_player_frame.grid(row=0, column=6, sticky="nsew")
            self.sixth_player = customtkinter.CTkEntry(self.sixth_player_frame, placeholder_text="enter name", fg_color="#22548b")
            self.sixth_player.grid(row=0, column=0, columnspan=4, padx=(10, 0), pady=(20, 20))

            self.first_round_points_p6 = customtkinter.CTkLabel(self.sixth_player_frame, width=50, text="points", anchor="w", text_color="grey")
            self.first_round_points_p6.grid(row=1, column=1, padx=(5, 0), pady=(0, 0))
            self.first_round_pred_p6 = customtkinter.CTkEntry(self.sixth_player_frame, width=55, placeholder_text="pred")
            self.first_round_pred_p6.grid(row=1, column=2, pady=(0, 5))
            self.first_round_act_p6 = customtkinter.CTkEntry(self.sixth_player_frame, width=55, placeholder_text="act")
            self.first_round_act_p6.grid(row=1, column=3, pady=(0, 5))
            self.first_round_pred_p6.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p6, self.first_round_pred_p6.get(), self.first_round_act_p6.get(), self.pred_p6, self.points_p6))
            self.first_round_act_p6.bind("<KeyRelease>", lambda event: self.update_label(event, 0, self.first_round_points_p6, self.first_round_pred_p6.get(), self.first_round_act_p6.get(), self.pred_p6, self.points_p6))

            previous_points_label = self.first_round_points_p6

            for round_number in range(2, set_rows):
                round_points_label, round_pred_entry, round_act_entry = self.create_round_widgets_for_other_player(self.sixth_player_frame, round_number,
                                                                                                               previous_points_label, self.pred_p6, self.points_p6)
                previous_points_label = round_points_label

                setattr(self, f'round_points_p6_R{round_number}', round_points_label)
                setattr(self, f'round_pred_p6_R{round_number}', round_pred_entry)
                setattr(self, f'round_act_p6_R{round_number}', round_act_entry)
        else:
            pass

         # set default values and bind sideframe names
        self.appearance_mode_optionemenu.set("Dark")
        self.scaling_optionemenu.set("100%")
        self.first_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.first_player, self.name_p1))
        self.second_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.second_player, self.name_p2))
        self.third_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.third_player, self.name_p3))
        if self.intUserInput > 3:
            self.fourth_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.fourth_player, self.name_p4))
        if self.intUserInput > 4:
            self.fifth_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.fifth_player, self.name_p5))
        if self.intUserInput > 5:
            self.sixth_player.bind("<KeyRelease>", lambda event: self.update_prediction_side_name(event, self.sixth_player, self.name_p6))

    def change_appearance_mode_event(self, new_appearance_mode: str):
        customtkinter.set_appearance_mode(new_appearance_mode)

    def change_scaling_event(self, new_scaling: str):
        new_scaling_float = int(new_scaling.replace("%", "")) / 100
        customtkinter.set_widget_scaling(new_scaling_float)

    def update_prediction_side_name(self, event, entry_widget, label_widget):
        name = entry_widget.get()
        label_widget.configure(text=f"{name}:")

    def update_prediction_side_pred(self, event, entry_widget, label_widget):
        prediction = entry_widget.get()
        label_widget.configure(text=prediction)

    def update_label(self, event, label_point_before,label_point_after, entry_widget_pred, entry_widget_act, player_pred_side, player_point_side):
        global int_pred
        global int_act
        global int_label
        try:
            int_pred = int(entry_widget_pred)
            player_pred_side.configure(text=int_pred)
        except ValueError:
            print("The string is not a valid integer.")

        try:
            int_pred = int(entry_widget_pred)
            int_act = int(entry_widget_act)
        except ValueError:
            print("The string is not a valid integer..")
            return None

        try:
            int_label = int(label_point_before.cget("text"))
        except:
            int_label = 0

        dif = abs(int(int_pred) - int(int_act))
        if dif == 0:
            new_points = int_label + (int_pred*10) + 20
            label_point_after.configure(text=new_points)
            player_point_side.configure(text=new_points)
        else:
            new_points = int_label - (dif*10)
            label_point_after.configure(text=new_points)
            player_point_side.configure(text=new_points)


    def create_round_widgets_for_first_player(self, frame, round_number, prev_points_label, player_pred_side, player_point_side):
        round_label = customtkinter.CTkLabel(frame, text=f"{round_number} Round:", anchor="w")
        round_label.grid(row=round_number, column=0, padx=(0, 15), pady=(0, 5))

        round_points_label = customtkinter.CTkLabel(frame, width=50, text="points", anchor="w",
                                                    text_color="grey")
        round_points_label.grid(row=round_number, column=1, pady=(0, 5))

        round_pred_entry = customtkinter.CTkEntry(frame, width=55, placeholder_text="pred")
        round_pred_entry.grid(row=round_number, column=2, pady=(0, 5))

        round_act_entry = customtkinter.CTkEntry(frame, width=55, placeholder_text="act")
        round_act_entry.grid(row=round_number, column=3, pady=(0, 5))

        round_pred_entry.bind("<KeyRelease>",
                              lambda event: self.update_label(event, prev_points_label, round_points_label,
                                                              round_pred_entry.get(), round_act_entry.get(), player_pred_side, player_point_side))
        round_act_entry.bind("<KeyRelease>",
                             lambda event: self.update_label(event, prev_points_label, round_points_label,
                                                             round_pred_entry.get(), round_act_entry.get(), player_pred_side, player_point_side))

        return round_label, round_points_label, round_pred_entry, round_act_entry

    def create_round_widgets_for_other_player(self, frame, round_number, prev_points_label, player_pred_side, player_point_side):
        round_points_label = customtkinter.CTkLabel(frame, width=50, text="points", anchor="w",
                                                    text_color="grey")
        round_points_label.grid(row=round_number, column=1, padx=(5, 0), pady=(0, 5))

        round_pred_entry = customtkinter.CTkEntry(frame, width=55, placeholder_text="pred")
        round_pred_entry.grid(row=round_number, column=2, pady=(0, 5))

        round_act_entry = customtkinter.CTkEntry(frame, width=55, placeholder_text="act")
        round_act_entry.grid(row=round_number, column=3, pady=(0, 5))

        round_pred_entry.bind("<KeyRelease>",
                              lambda event: self.update_label(event, prev_points_label, round_points_label,
                                                              round_pred_entry.get(), round_act_entry.get(), player_pred_side, player_point_side))
        round_act_entry.bind("<KeyRelease>",
                             lambda event: self.update_label(event, prev_points_label, round_points_label,
                                                             round_pred_entry.get(), round_act_entry.get(), player_pred_side, player_point_side))

        return round_points_label, round_pred_entry, round_act_entry

if __name__ == "__main__":
    app = App()
    app.mainloop()