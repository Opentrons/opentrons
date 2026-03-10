"""Plot Main."""
import argparse
from .dash_plotter import RealTimePlotter

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real-time CSV plotter using Dash")
    parser.add_argument("--path", type=str, default=None, 
                       help="Directory to monitor for CSV files")
    parser.add_argument("--port", type=int, default=8050, 
                       help="Port for the web server")
    parser.add_argument("--debug", action="store_true", 
                       help="Run in debug mode")
    
    args = parser.parse_args()
    
    plotter = RealTimePlotter(args.path)
    plotter.run(debug=args.debug, port=args.port)