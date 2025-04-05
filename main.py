from Services.CritSrvs.server import run_server
import argparse

 ####
 ## IMPORTANT: HOW TO RUN POLLING AND DATABASES SERVICES
 ## Run both services: python main.py --server --polling
 ## Run only the server: python main.py --server
 ## Run only the polling: python main.py --polling
 ####

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--server', action='store_true', help='Run the server')
    args = parser.parse_args()

    if args.server:
        run_server() 