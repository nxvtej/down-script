download:
	@node retool_download/dist/index.js $(firstword $(MAKECMDGOALS)) $(word 2, $(MAKECMDGOALS))

# Prevent Make from treating arguments as targets
%:
	@:
