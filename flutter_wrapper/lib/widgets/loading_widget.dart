import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  final String label;
  final int progress;

  const LoadingWidget({super.key, this.label = 'Loading...', this.progress = 0});

  @override
  Widget build(BuildContext context) {
    final value = progress.clamp(0, 100);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 88,
          height: 88,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                color: Colors.tealAccent.shade700,
                strokeWidth: 5,
                value: value > 0 ? value / 100 : null,
              ),
              const Icon(Icons.health_and_safety, size: 32, color: Colors.white),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
          textAlign: TextAlign.center,
        ),
        if (value > 0) ...[
          const SizedBox(height: 8),
          Text(
            '$value% complete',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ],
      ],
    );
  }
}
