import uuid
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from games.models import Game, GameKey, Publisher

PUBLISHERS = [
    "Rockstar Games",
    "Naughty Dog",
    "CD Projekt Red",
    "Nintendo",
    "Bethesda Softworks",
    "FromSoftware",
    "Insomniac Games",
    "Ubisoft",
    "Electronic Arts",
    "Activision",
    "Square Enix",
    "Sony Interactive Entertainment",
]

GAMES = [
    (
        "Red Dead Redemption 2",
        "pc",
        199.90, 14.90, 4.9, True, False,
        "Rockstar Games",
        date(2019, 11, 5),
        ["Action", "Adventure", "Open World"],
        "Uma épica história de honra e lealdade no declínio da era do Velho Oeste americano. Jogue como Arthur Morgan, membro de uma gangue que tenta sobreviver em uma América em transformação.",
    ),
    (
        "Grand Theft Auto V",
        "pc",
        99.90, 9.90, 4.7, True, False,
        "Rockstar Games",
        date(2015, 4, 14),
        ["Action", "Open World", "Crime"],
        "Explore o vasto e ensolarado mundo de Los Santos em uma narrativa de três criminosos que planejam golpes sob pressão das autoridades.",
    ),
    (
        "The Last of Us Part I",
        "ps5",
        299.90, 19.90, 4.9, True, False,
        "Naughty Dog",
        date(2022, 9, 2),
        ["Action", "Survival", "Horror"],
        "Uma jornada brutal e emocionante pela América pós-pandemia. Joel deve proteger Ellie enquanto atravessam o país em busca de esperança.",
    ),
    (
        "The Last of Us Part II",
        "playstation",
        249.90, 17.90, 4.8, True, False,
        "Naughty Dog",
        date(2020, 6, 19),
        ["Action", "Survival", "Horror"],
        "Cinco anos após a aventura anterior, Ellie embarca em uma jornada implacável movida pela busca por justiça e pela luta contra o ódio.",
    ),
    (
        "The Witcher 3: Wild Hunt",
        "pc",
        99.90, 9.90, 4.9, True, False,
        "CD Projekt Red",
        date(2015, 5, 19),
        ["RPG", "Open World", "Fantasy"],
        "Como Geralt de Rívia, um caçador de monstros profissional, você está em busca de sua filha adotiva enquanto navega por um mundo devastado pela guerra.",
    ),
    (
        "Cyberpunk 2077",
        "pc",
        149.90, 12.90, 4.7, True, False,
        "CD Projekt Red",
        date(2020, 12, 10),
        ["RPG", "Action", "Cyberpunk"],
        "Em Night City, uma megalópole obcecada por poder e glamour, você joga como V — um mercenário em busca de um implante único que garante imortalidade.",
    ),
    (
        "The Legend of Zelda: Tears of the Kingdom",
        "switch",
        299.90, 22.90, 4.9, True, True,
        "Nintendo",
        date(2023, 5, 12),
        ["Adventure", "Open World", "Fantasy"],
        "Link explora as misteriosas ruínas flutuantes acima de Hyrule e as profundezas abaixo da terra em uma nova aventura épica.",
    ),
    (
        "The Legend of Zelda: Breath of the Wild",
        "switch",
        249.90, 19.90, 4.8, True, False,
        "Nintendo",
        date(2017, 3, 3),
        ["Adventure", "Open World", "Fantasy"],
        "Desperte em Hyrule e descubra a lenda de Link em um mundo aberto deslumbrante repleto de segredos, masmorras e descobertas.",
    ),
    (
        "Elden Ring",
        "pc",
        249.90, 18.90, 4.9, True, False,
        "FromSoftware",
        date(2022, 2, 25),
        ["RPG", "Action", "Fantasy", "Soulslike"],
        "Um RPG de ação épico ambientado nas Terras Intermediárias — um mundo criado em colaboração com George R.R. Martin. Desafie os senhores semideuses e reclame o Anel Ancestral.",
    ),
    (
        "Dark Souls III",
        "pc",
        129.90, 11.90, 4.8, True, False,
        "FromSoftware",
        date(2016, 4, 12),
        ["RPG", "Action", "Soulslike", "Fantasy"],
        "A última fogueira está se apagando. Levante-se, Sem Chama, e enfrente os senhores das cinzas em uma jornada sombria e desafiadora.",
    ),
    (
        "Marvel's Spider-Man 2",
        "ps5",
        349.90, 24.90, 4.8, True, True,
        "Insomniac Games",
        date(2023, 10, 20),
        ["Action", "Adventure", "Superhero"],
        "Peter Parker e Miles Morales enfrentam novas ameaças, incluindo o poderoso Venom, em uma aventura expandida por toda a cidade de Nova York.",
    ),
    (
        "Marvel's Spider-Man: Miles Morales",
        "ps5",
        249.90, 17.90, 4.8, True, False,
        "Insomniac Games",
        date(2020, 11, 12),
        ["Action", "Adventure", "Superhero"],
        "Miles Morales assume o manto do Homem-Aranha e protege sua vizinhança enquanto descobre o alcance de seus próprios poderes.",
    ),
    (
        "Assassin's Creed Mirage",
        "pc",
        199.90, 14.90, 4.2, False, False,
        "Ubisoft",
        date(2023, 10, 5),
        ["Action", "Stealth", "Adventure"],
        "Bassim, um ladrão de rua em Bagdá, encontra seu caminho na Irmandade dos Assassinos em um retorno às raízes furtivas da série.",
    ),
    (
        "Assassin's Creed Valhalla",
        "pc",
        149.90, 11.90, 4.3, False, False,
        "Ubisoft",
        date(2020, 11, 10),
        ["Action", "RPG", "Open World"],
        "Jogue como Eivor, um guerreiro viking, enquanto lidera seu clã em uma invasão à Inglaterra do século IX em busca de glória e um novo lar.",
    ),
    (
        "FIFA 24",
        "pc",
        249.90, 16.90, 4.1, False, False,
        "Electronic Arts",
        date(2023, 9, 29),
        ["Sports", "Soccer", "Simulation"],
        "O jogo de futebol mais completo do mundo, com HyperMotionV e os melhores clubes, ligas e jogadores do futebol mundial.",
    ),
    (
        "EA Sports FC 25",
        "pc",
        299.90, 18.90, 4.0, False, True,
        "Electronic Arts",
        date(2024, 9, 27),
        ["Sports", "Soccer", "Simulation"],
        "A nova era do futebol começa. FC IQ, estilos de jogo e a mais completa representação do futebol mundial na palma da sua mão.",
    ),
    (
        "Call of Duty: Modern Warfare III",
        "pc",
        299.90, 19.90, 4.2, False, False,
        "Activision",
        date(2023, 11, 10),
        ["FPS", "Shooter", "Action"],
        "A Task Force 141 enfrenta seu maior inimigo até hoje. Multiplayer clássico, modo Zombies e uma campanha intensa ambientada em cenários mundiais.",
    ),
    (
        "Call of Duty: Black Ops 6",
        "pc",
        349.90, 22.90, 4.3, False, True,
        "Activision",
        date(2024, 10, 25),
        ["FPS", "Shooter", "Action"],
        "Na era pós-Guerra Fria dos anos 90, uma equipe de operativos enfrenta uma ameaça global enquanto desvendam a verdade sobre a CIA.",
    ),
    (
        "Final Fantasy XVI",
        "ps5",
        299.90, 21.90, 4.6, False, False,
        "Square Enix",
        date(2023, 6, 22),
        ["RPG", "Action", "Fantasy"],
        "Em Valisthea, um mundo governado por Dominantes que controlam Ícones divinos, Clive Rosfield embarca em uma jornada de vingança e redenção.",
    ),
    (
        "Final Fantasy VII Rebirth",
        "ps5",
        349.90, 24.90, 4.8, True, True,
        "Square Enix",
        date(2024, 2, 29),
        ["RPG", "Action", "Fantasy"],
        "Cloud e seus aliados deixam Midgar e partem em uma aventura épica por um mundo aberto e deslumbrante em busca de Sephiroth.",
    ),
    (
        "God of War: Ragnarök",
        "ps5",
        349.90, 24.90, 4.9, True, False,
        "Sony Interactive Entertainment",
        date(2022, 11, 9),
        ["Action", "Adventure", "Mythology"],
        "Kratos e Atreus devem viajar pelos Nove Reinos para preparar-se para o Ragnarök enquanto enfrentam a ira de Odin.",
    ),
    (
        "God of War (2018)",
        "pc",
        149.90, 12.90, 4.9, True, False,
        "Sony Interactive Entertainment",
        date(2022, 1, 14),
        ["Action", "Adventure", "Mythology"],
        "Após abandonar sua vida como deus da guerra, Kratos parte para os reinos nórdicos com seu filho Atreus em uma jornada de descoberta e sobrevivência.",
    ),
    (
        "Hogwarts Legacy",
        "pc",
        199.90, 14.90, 4.5, False, False,
        "Electronic Arts",
        date(2023, 2, 10),
        ["RPG", "Adventure", "Fantasy"],
        "Explore o mundo mágico de Hogwarts no século XIX em um RPG de ação repleto de criaturas mágicas, feitiços e segredos antigos.",
    ),
    (
        "Baldur's Gate 3",
        "pc",
        199.90, 16.90, 4.9, True, False,
        "Bethesda Softworks",
        date(2023, 8, 3),
        ["RPG", "Turn-Based", "Fantasy"],
        "Reunidos por um parasita misterioso, um grupo improvável de aventureiros deve trabalhar juntos — ou não — para combater um mal ancestral.",
    ),
    (
        "Starfield",
        "pc",
        249.90, 17.90, 4.1, False, False,
        "Bethesda Softworks",
        date(2023, 9, 6),
        ["RPG", "Sci-Fi", "Open World"],
        "Em 2330, a humanidade colonizou o espaço. Como membro da Constellation, você parte em busca de artefatos misteriosos que podem revelar os segredos do universo.",
    ),
    (
        "Super Mario Odyssey",
        "switch",
        249.90, 17.90, 4.9, True, False,
        "Nintendo",
        date(2017, 10, 27),
        ["Platform", "Adventure", "Family"],
        "Mario viaja por reinos exóticos ao redor do mundo com seu novo aliado, Cappy, para resgatar a Princesa Peach das garras de Bowser.",
    ),
    (
        "Mario Kart 8 Deluxe",
        "switch",
        249.90, 16.90, 4.8, True, False,
        "Nintendo",
        date(2017, 4, 28),
        ["Racing", "Multiplayer", "Family"],
        "O jogo de kart mais completo de todos os tempos com 48 pistas remasterizadas, novos modos e personagens icônicos do universo Mario.",
    ),
    (
        "Resident Evil 4 Remake",
        "pc",
        199.90, 14.90, 4.8, True, False,
        "Electronic Arts",
        date(2023, 3, 24),
        ["Survival Horror", "Action", "Third-Person Shooter"],
        "Leon S. Kennedy é enviado a uma remota aldeia europeia para resgatar a filha do presidente — completamente recriado com gráficos e gameplay modernos.",
    ),
    (
        "Resident Evil Village",
        "pc",
        149.90, 11.90, 4.7, True, False,
        "Electronic Arts",
        date(2021, 5, 7),
        ["Survival Horror", "Action", "First-Person"],
        "Ethan Winters chega a uma aldeia europeia sombria em busca de sua filha sequestrada. Uma experiência aterrorizante em primeira pessoa.",
    ),
    (
        "Horizon Forbidden West",
        "ps5",
        299.90, 21.90, 4.7, True, False,
        "Sony Interactive Entertainment",
        date(2022, 2, 18),
        ["Action", "RPG", "Open World"],
        "Aloy atravessa o devastado Oeste para enfrentar uma ameaça misteriosa que pode destruir todos os ecossistemas da Terra.",
    ),
]

class Command(BaseCommand):
    help = "Seed the database with sample games and publishers."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keys",
            type=int,
            default=3,
            help="Number of GameKeys to generate per game (default: 3).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing games, publishers and keys before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        keys_per_game: int = options["keys"]

        if options["clear"]:
            GameKey.objects.all().delete()
            Game.objects.all().delete()
            Publisher.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing data cleared."))

        publisher_map: dict[str, Publisher] = {}
        for name in PUBLISHERS:
            pub, created = Publisher.objects.get_or_create(name=name)
            publisher_map[name] = pub
            if created:
                self.stdout.write(f"  Publisher: {name}")

        created_count = 0
        skipped_count = 0

        for (
            name, platform, original_price, rental_price, rating,
            is_featured, is_new, publisher_name, release_date, genre, description,
        ) in GAMES:
            publisher = publisher_map.get(publisher_name)

            game, created = Game.objects.get_or_create(
                name=name,
                defaults=dict(
                    platform=platform,
                    original_price=original_price,
                    rental_price=rental_price,
                    rating=rating,
                    is_featured=is_featured,
                    is_new=is_new,
                    publisher=publisher,
                    release_date=release_date,
                    genre=genre,
                    description=description,
                ),
            )

            if created:
                GameKey.objects.bulk_create([
                    GameKey(game=game, key=str(uuid.uuid4()), status="available")
                    for _ in range(keys_per_game)
                ])
                created_count += 1
                featured_tag = " [FEATURED]" if game.is_featured else ""
                new_tag = " [NEW]" if game.is_new else ""
                self.stdout.write(
                    f"  + {game.name} ({game.platform.upper()}) "
                    f"R${game.rental_price}/day — {keys_per_game} keys{featured_tag}{new_tag}"
                )
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} games created, {skipped_count} already existed. "
                f"{created_count * keys_per_game} game keys generated."
            )
        )
